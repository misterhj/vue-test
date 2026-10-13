<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
	RESOURCE_LIST_CONFIGS,
	type ResourceListConfig,
} from '@/config/resource-list.config'
import type {
	ResourceColumnFilterDef,
	ResourceColumnFilterValue,
	ResourceListFilterOption,
	ResourceListFilters,
	ResourceListViewColumn,
} from '@/config/resource-list.types'
import {
	listService,
	clearOptionsCache,
	getOptions,
	type ListParams,
} from '@/services/list.services'
import { useAuthStore } from '@/stores/auth'
import ColumnFilter from './ColumnFilter.vue'
import ResourceFormModal from './ResourceFormModal.vue'

type ResourceRow = Record<string, unknown>

const props = defineProps<{
	resource: string
	/** Filtros externos que se aplican siempre (p. ej. `{ brandId: 3 }`). Tienen prioridad. */
	forcedFilters?: Record<string, unknown>
	/** Permite seleccionar una fila (emite `rowClick`). */
	selectable?: boolean
	/** `id` de la fila seleccionada, para resaltarla. */
	selectedId?: number | string | null
	/** Oculta la fila de filtros por columna. */
	hideFilters?: boolean
}>()

const emit = defineEmits<{
	(e: 'row-click', row: ResourceRow): void
}>()

const authStore = useAuthStore()

const config = computed<ResourceListConfig | undefined>(
	() => RESOURCE_LIST_CONFIGS[props.resource],
)

/** Recurso contra el backend (`config.resource` permite alias, p. ej. subcategories → categories). */
const apiResource = computed(() => config.value?.resource ?? props.resource)

const showFormModal = ref(false)
const editingRow = ref<ResourceRow | null>(null)
const formSaving = ref(false)
const formError = ref('')

const permissionPrefix = computed(() => config.value?.permission.split(':')[0] ?? '')
const canManage = computed(() => Boolean(config.value?.form?.length))
const canCreate = computed(() =>
	canManage.value && authStore.hasPermission(`${permissionPrefix.value}:create`),
)
const canUpdate = computed(() =>
	canManage.value && authStore.hasPermission(`${permissionPrefix.value}:update`),
)
const canDelete = computed(() =>
	canManage.value && authStore.hasPermission(`${permissionPrefix.value}:delete`),
)
const hasManagementActions = computed(() =>
	canManage.value && (canCreate.value || canUpdate.value || canDelete.value),
)

const formFields = computed(() => config.value?.form ?? [])
const modalTitle = computed(() =>
	editingRow.value ? `Editar ${config.value?.title ?? ''}` : `Nuevo ${config.value?.title ?? ''}`,
)
const modalInitial = computed<Record<string, unknown> | undefined>(() => {
	const row = editingRow.value
	if (!row) {
		return undefined
	}
	const initial: Record<string, unknown> = {}
	for (const field of formFields.value) {
		if (row[field.key] !== undefined) {
			initial[field.key] = row[field.key]
		}
	}
	return initial
})

const rows = ref<ResourceRow[]>([])
const clientRows = ref<ResourceRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')

const limit = ref(config.value?.defaultLimit ?? 15)
const sortBy = ref(config.value?.defaultSort?.field ?? 'id')
const sortOrder = ref<'ASC' | 'DESC'>(config.value?.defaultSort?.order ?? 'DESC')
const showFilters = ref(true)

const filters = reactive<Record<string, ResourceColumnFilterValue>>({})
const textFilters = reactive<Record<string, string>>({})
const filterOptions = reactive<Record<string, ResourceListFilterOption[]>>({})

function buildColumnFilter(col: ResourceListViewColumn): ResourceColumnFilterDef {
	let type = col.filterType
	let options = col.filterOptions

	if (!type) {
		if (col.type === 'date') {
			type = 'date'
		} else if (col.type === 'number' || col.type === 'currency') {
			type = 'number'
		} else if (col.type === 'boolean') {
			type = 'select'
			options = [
				{ value: true, label: 'Sí' },
				{ value: false, label: 'No' },
			]
		} else {
			type = 'text'
		}
	}

	const multiple =
		type === 'select' ? (col.filterMultiple ?? false) : false

	return {
		key: col.filterKey ?? col.key,
		columnKey: col.key,
		type,
		multiple,
		boolean: col.type === 'boolean',
		placeholder: col.filterPlaceholder ?? (type === 'select' ? 'Buscar...' : 'Filtrar...'),
		options,
		optionsResource: col.filterOptionsResource,
		optionLabel: col.filterOptionLabel,
	}
}

const columnFilters = computed<ResourceColumnFilterDef[]>(() =>
	(config.value?.columns ?? [])
		.filter((col) => col.filterable)
		.map((col) => buildColumnFilter(col)),
)

const columnFilterMap = computed<Record<string, ResourceColumnFilterDef>>(() => {
	const map: Record<string, ResourceColumnFilterDef> = {}
	for (const def of columnFilters.value) {
		map[def.columnKey] = def
	}
	return map
})

const columnFilterKeys = computed(
	() => new Set(columnFilters.value.map((def) => def.key)),
)

const leftoverFilters = computed<ResourceListFilters[]>(() =>
	(config.value?.filters ?? []).filter((filter) => !columnFilterKeys.value.has(filter.key)),
)

const hasFilters = computed(
	() => columnFilters.value.length > 0 || leftoverFilters.value.length > 0,
)

const filterCells = computed(() =>
	(config.value?.columns ?? []).map((col) => ({
		col,
		def: columnFilterMap.value[col.key] ?? null,
	})),
)

const hasActiveFilters = computed(() =>
	Object.values(filters).some((value) =>
		Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined,
	),
)

function getDeep(obj: unknown, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, key) => {
		if (acc == null) {
			return undefined
		}
		return (acc as Record<string, unknown>)[key]
	}, obj)
}

function getCellValue(row: ResourceRow, col: ResourceListViewColumn): unknown {
	if (col.get) {
		return col.get(row)
	}
	return getDeep(row, col.key)
}

function columnStyle(col: ResourceListViewColumn) {
	const style: Record<string, string> = {}
	if (col.align) {
		style.textAlign = col.align
	}
	if (col.minWidth) {
		style.minWidth = col.minWidth
	}
	return Object.keys(style).length ? style : undefined
}

function formatDate(value: unknown): string {
	const date = new Date(String(value))
	if (Number.isNaN(date.getTime())) {
		return '—'
	}
	return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function formatCell(value: unknown, col: ResourceListViewColumn): string {
	if (value === null || value === undefined || value === '') {
		return '—'
	}
	switch (col.type) {
		case 'boolean':
			return value ? 'Sí' : 'No'
		case 'date':
			return formatDate(value)
		case 'currency':
			return `$${Number(value).toLocaleString('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`
		case 'number':
			return Number(value).toLocaleString('en-US')
		default:
			return String(value)
	}
}

function collectFilters(): Record<string, unknown> | undefined {
	const result: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(filters)) {
		if (value === '' || value === null || value === undefined) {
			continue
		}
		if (Array.isArray(value) && value.length === 0) {
			continue
		}
		result[key] = value
	}
	for (const [key, value] of Object.entries(props.forcedFilters ?? {})) {
		if (value === '' || value === null || value === undefined) {
			continue
		}
		result[key] = value
	}
	return Object.keys(result).length ? result : undefined
}

function isSelected(row: ResourceRow): boolean {
	return (
		props.selectable === true &&
		props.selectedId !== null &&
		props.selectedId !== undefined &&
		Number(row.id) === Number(props.selectedId)
	)
}

function buildParams(page: number): ListParams {
	return {
		page,
		limit: limit.value,
		sortBy: sortBy.value,
		sortOrder: sortOrder.value,
		filters: collectFilters(),
	}
}

async function fetchAllPages(params: ListParams): Promise<ResourceRow[]> {
	const collected: ResourceRow[] = []
	let page = 1
	let last = 1
	const maxPages = 100
	do {
		const res = await listService.getAll<ResourceRow>(apiResource.value, {
			...params,
			page,
			limit: 100,
		})
		collected.push(...res.data)
		last = res.last_page
		page += 1
		if (page > maxPages) {
			break
		}
	} while (page <= last)
	return collected
}

function updateClientPagination() {
	total.value = clientRows.value.length
	lastPage.value = Math.max(1, Math.ceil(clientRows.value.length / limit.value))
	if (currentPage.value > lastPage.value) {
		currentPage.value = lastPage.value
	}
}

async function fetchData(page = 1) {
	if (!config.value) {
		return
	}
	loading.value = true
	error.value = ''
	try {
		if (config.value.clientFilter) {
			const all = await fetchAllPages({
				sortBy: sortBy.value,
				sortOrder: sortOrder.value,
				filters: collectFilters(),
			})
			clientRows.value = all.filter((row) => config.value!.clientFilter!(row))
			currentPage.value = 1
			updateClientPagination()
		} else {
			const res = await listService.getAll<ResourceRow>(apiResource.value, buildParams(page))
			rows.value = res.data
			currentPage.value = res.current_page
			lastPage.value = res.last_page
			total.value = res.total
		}
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al cargar los datos'
		rows.value = []
		clientRows.value = []
		total.value = 0
		lastPage.value = 1
	} finally {
		loading.value = false
	}
}

const displayRows = computed<ResourceRow[]>(() => {
	if (config.value?.clientFilter) {
		const start = (currentPage.value - 1) * limit.value
		return clientRows.value.slice(start, start + limit.value)
	}
	return rows.value
})

const textTimers = new Map<string, ReturnType<typeof setTimeout>>()

function onColumnText(def: ResourceColumnFilterDef, value: string) {
	textFilters[def.key] = value
	const existing = textTimers.get(def.key)
	if (existing) {
		clearTimeout(existing)
	}
	textTimers.set(
		def.key,
		setTimeout(() => {
			const raw = (textFilters[def.key] ?? '').trim()
			filters[def.key] = def.type === 'number' && raw !== '' ? Number(raw) : raw
			fetchData(1)
		}, 500),
	)
}

function onColumnValue(def: ResourceColumnFilterDef, value: ResourceColumnFilterValue) {
	filters[def.key] = value
	fetchData(1)
}

function clearFilters() {
	for (const def of columnFilters.value) {
		if (def.type === 'text' || def.type === 'number') {
			textFilters[def.key] = ''
			filters[def.key] = ''
		} else if (def.type === 'select' && def.multiple) {
			filters[def.key] = []
		} else {
			filters[def.key] = ''
		}
	}
	for (const filter of leftoverFilters.value) {
		if (filter.type === 'boolean') {
			delete filters[filter.key]
		} else {
			filters[filter.key] = ''
		}
	}
	fetchData(1)
}

function toggleSort(field: string) {
	if (sortBy.value === field) {
		sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
	} else {
		sortBy.value = field
		sortOrder.value = 'ASC'
	}
	fetchData(1)
}

function goToPage(page: number) {
	if (page < 1 || page > lastPage.value || page === currentPage.value) {
		return
	}
	if (config.value?.clientFilter) {
		currentPage.value = page
		return
	}
	fetchData(page)
}

function changeLimit() {
	currentPage.value = 1
	if (config.value?.clientFilter) {
		updateClientPagination()
		return
	}
	fetchData(1)
}

function onSelectFilter(filter: ResourceListFilters, raw: string) {
	if (raw === '') {
		delete filters[filter.key]
	} else {
		const option = (filterOptions[filter.key] ?? []).find(
			(opt) => String(opt.value) === raw,
		)
		filters[filter.key] = option ? (option.value as ResourceColumnFilterValue) : raw
	}
	fetchData(1)
}

function onBooleanFilterChange(filter: ResourceListFilters, event: Event) {
	const checked = (event.target as HTMLInputElement).checked
	if (checked) {
		filters[filter.key] = true
	} else {
		delete filters[filter.key]
	}
	fetchData(1)
}

async function loadOptionsFor(key: string, resource: string, optionLabel?: string) {
	try {
		filterOptions[key] = await getOptions(resource, optionLabel)
	} catch {
		filterOptions[key] = []
	}
}

async function loadFilterOptions() {
	for (const filter of leftoverFilters.value) {
		if (filter.options) {
			filterOptions[filter.key] = filter.options
		} else if (filter.optionsResource) {
			await loadOptionsFor(filter.key, filter.optionsResource, filter.optionLabel)
		}
	}
	for (const def of columnFilters.value) {
		if (def.type !== 'select') {
			continue
		}
		if (def.options) {
			filterOptions[def.key] = def.options
		} else if (def.optionsResource) {
			await loadOptionsFor(def.key, def.optionsResource, def.optionLabel)
		}
	}
}

function openCreate() {
	editingRow.value = null
	formError.value = ''
	showFormModal.value = true
}

function openEdit(row: ResourceRow) {
	editingRow.value = row
	formError.value = ''
	showFormModal.value = true
}

function closeModal() {
	showFormModal.value = false
	editingRow.value = null
	formError.value = ''
}

async function handleSave(payload: Record<string, unknown>) {
	if (!config.value) {
		return
	}
	formSaving.value = true
	formError.value = ''
	try {
		const endpoint = config.value.endpoint ?? config.value.resource
		if (editingRow.value) {
			await listService.update(endpoint, Number(editingRow.value.id), payload)
		} else {
			await listService.create(endpoint, payload)
		}
		closeModal()
		clearOptionsCache()
		fetchData(currentPage.value)
	} catch (err: unknown) {
		formError.value = (err as { message?: string })?.message ?? 'Error al guardar'
	} finally {
		formSaving.value = false
	}
}

async function removeRow(row: ResourceRow) {
	if (!config.value) {
		return
	}
	if (!window.confirm(`¿Estás seguro de eliminar este elemento?`)) {
		return
	}
	try {
		const endpoint = config.value.endpoint ?? config.value.resource
		await listService.remove(endpoint, Number(row.id))
		clearOptionsCache()
		fetchData(currentPage.value)
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

const tableColspan = computed(() => {
	const cols = config.value?.columns.length ?? 0
	return cols + (hasManagementActions.value ? 1 : 0)
})

const title = computed(() => config.value?.title ?? props.resource)

function applyConfigDefaults() {
	limit.value = config.value?.defaultLimit ?? 15
	sortBy.value = config.value?.defaultSort?.field ?? 'id'
	sortOrder.value = config.value?.defaultSort?.order ?? 'DESC'
}

function resetFilterState() {
	for (const key of Object.keys(filters)) {
		delete filters[key]
	}
	for (const key of Object.keys(textFilters)) {
		delete textFilters[key]
	}
	for (const key of Object.keys(filterOptions)) {
		delete filterOptions[key]
	}
	for (const def of columnFilters.value) {
		if (def.type === 'text' || def.type === 'number') {
			textFilters[def.key] = ''
		} else if (def.type === 'select' && def.multiple) {
			filters[def.key] = []
		} else {
			filters[def.key] = ''
		}
	}
}

function initializeState() {
	applyConfigDefaults()
	currentPage.value = 1
	lastPage.value = 1
	total.value = 0
	rows.value = []
	clientRows.value = []
	error.value = ''
	showFormModal.value = false
	editingRow.value = null
	resetFilterState()
	loadFilterOptions()
	fetchData(1)
}

onMounted(initializeState)

watch(() => props.resource, initializeState)

onUnmounted(() => {
	for (const timer of textTimers.values()) {
		clearTimeout(timer)
	}
})
</script>

<template>
	<div v-if="config" class="resource-list">
		<div class="rl-header">
			<h1>{{ title }}</h1>
		</div>

		<div v-if="!hideFilters && leftoverFilters.length" class="rl-filters">
			<label v-for="filter in leftoverFilters" :key="filter.key" class="rl-filter-item">
				<span>{{ filter.label }}</span>
				<select
					v-if="filter.type === 'select'"
					:value="filters[filter.key] ?? ''"
					@change="
						onSelectFilter(filter, ($event.target as HTMLSelectElement).value)
					"
				>
					<option value="">Todos</option>
					<option
						v-for="opt in filterOptions[filter.key] ?? []"
						:key="String(opt.value)"
						:value="opt.value"
					>
						{{ opt.label }}
					</option>
				</select>
				<input
					v-else
					type="checkbox"
					:checked="Boolean(filters[filter.key])"
					@change="onBooleanFilterChange(filter, $event)"
				/>
			</label>
		</div>

		<div v-if="loading" class="rl-message">Cargando {{ title.toLowerCase() }}...</div>
		<div v-else-if="error" class="rl-message rl-error">{{ error }}</div>

		<div v-else class="rl-table-wrap">
			<table class="rl-table">
				<thead>
					<tr class="rl-head-row">
						<th v-if="hasManagementActions" class="rl-actions-head">
							<button
								v-if="canCreate"
								class="rl-icon-btn rl-icon-btn-primary"
								title="Agregar"
								aria-label="Agregar"
								@click="openCreate()"
							>
								<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
									<path d="M12 5v14M5 12h14" />
								</svg>
							</button>
						</th>
						<th
							v-for="col in config.columns"
							:key="col.key"
							:class="{ 'rl-sortable': col.sortable }"
							:style="columnStyle(col)"
							@click="col.sortable && toggleSort(col.key)"
						>
							<span>{{ col.label }}</span>
							<span v-if="col.sortable && sortBy === col.key" class="rl-sort-arrow">
								{{ sortOrder === 'ASC' ? '▲' : '▼' }}
							</span>
						</th>
					</tr>
					<tr v-if="!hideFilters && showFilters" class="rl-filter-row">
						<th v-if="hasManagementActions" class="rl-actions-filter">
							<button
								v-if="hasActiveFilters"
								class="rl-icon-btn"
								title="Limpiar filtros"
								aria-label="Limpiar filtros"
								@click="clearFilters()"
							>
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
									<path d="M18 6 6 18M6 6l12 12" />
								</svg>
							</button>
						</th>
						<th
							v-for="cell in filterCells"
							:key="cell.col.key"
							class="rl-filter-cell"
							:style="columnStyle(cell.col)"
						>
							<ColumnFilter
								:def="cell.def"
								:options="cell.def ? filterOptions[cell.def.key] : undefined"
								:value="cell.def ? filters[cell.def.key] : undefined"
								:text="cell.def ? textFilters[cell.def.key] : undefined"
								@update:text="onColumnText"
								@update:value="onColumnValue"
							/>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="row in displayRows"
						:key="String(row.id)"
						:class="{
							'rl-row-selectable': selectable,
							'rl-row-active': isSelected(row),
						}"
						@click="selectable && emit('row-click', row)"
					>
						<td v-if="hasManagementActions" class="rl-actions">
							<div class="rl-actions-buttons">
								<button
									v-if="canUpdate"
									class="rl-icon-btn"
									title="Editar"
									aria-label="Editar"
									@click.stop="openEdit(row)"
								>
									<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M12 20h9" />
										<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
									</svg>
								</button>
								<button
									v-if="canDelete"
									class="rl-icon-btn rl-icon-btn-danger"
									title="Eliminar"
									aria-label="Eliminar"
									@click.stop="removeRow(row)"
								>
									<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M3 6h18" />
										<path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
										<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
									</svg>
								</button>
							</div>
						</td>
						<td
							v-for="col in config.columns"
							:key="col.key"
							:style="columnStyle(col)"
						>
							<span
								v-if="col.type === 'boolean'"
								class="rl-badge"
								:class="getCellValue(row, col) ? 'rl-badge-true' : 'rl-badge-false'"
							>
								{{ getCellValue(row, col) ? 'Sí' : 'No' }}
							</span>
							<span v-else>{{ formatCell(getCellValue(row, col), col) }}</span>
						</td>
					</tr>
					<tr v-if="displayRows.length === 0">
						<td :colspan="tableColspan" class="rl-empty">
							No se encontraron registros
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="rl-footer">
			<div class="rl-pagination">
				<button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
					Anterior
				</button>
				<span>
					Página {{ currentPage }} de {{ lastPage }} · {{ total }} registros
				</span>
				<button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)">
					Siguiente
				</button>
				<button
					v-if="hasFilters && !hideFilters"
					class="rl-icon-btn rl-filter-toggle"
					:class="{ 'rl-filter-toggle-active': showFilters }"
					:title="showFilters ? 'Ocultar filtros' : 'Mostrar filtros'"
					:aria-label="showFilters ? 'Ocultar filtros' : 'Mostrar filtros'"
					:aria-pressed="showFilters"
					@click="showFilters = !showFilters"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="7" />
						<path d="m21 21-4.3-4.3" />
					</svg>
				</button>
			</div>
			<select v-model.number="limit" class="rl-limit" @change="changeLimit">
				<option :value="10">10 / pág</option>
				<option :value="15">15 / pág</option>
				<option :value="25">25 / pág</option>
				<option :value="50">50 / pág</option>
				<option :value="100">100 / pág</option>
			</select>
		</div>

		<ResourceFormModal
			v-if="showFormModal"
			:title="modalTitle"
			:fields="formFields"
			:initial="modalInitial"
			:saving="formSaving"
			:error="formError"
			@save="handleSave"
			@close="closeModal"
		/>
	</div>
</template>

<style scoped>
.resource-list {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: #fff;
	padding: 20px;
	border-radius: 8px;
}

.rl-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 12px;
	flex-wrap: wrap;
	flex-shrink: 0;
}

.rl-header h1 {
	margin: 0;
	font-size: 1.4rem;
	color: #2c3e50;
}

.rl-filters {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	margin-bottom: 12px;
	padding: 12px;
	background: #f8f9fa;
	border-radius: 6px;
	flex-shrink: 0;
}

.rl-filter-item {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.9rem;
	color: #495057;
}

.rl-filter-item select {
	padding: 6px 8px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
}

.rl-message {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	text-align: center;
	color: #6c757d;
}

.rl-error {
	color: #dc3545;
}

.rl-table-wrap {
	flex: 1 1 auto;
	min-height: 0;
	width: 100%;
	overflow: auto;
}

.rl-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
}

.rl-table th,
.rl-table td {
	padding: 10px 12px;
	border-bottom: 1px solid #eee;
	text-align: left;
}

.rl-table thead th {
	position: sticky;
	background: #fff;
	white-space: nowrap;
	color: #6c757d;
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	user-select: none;
}

.rl-head-row th {
	top: 0;
	height: 38px;
	box-sizing: border-box;
	z-index: 3;
	box-shadow: inset 0 -1px 0 #eee;
}

.rl-filter-row th {
	top: 38px;
	z-index: 2;
	box-shadow: inset 0 -1px 0 #e9ecef;
}

.rl-filter-cell {
	padding: 6px 8px;
	vertical-align: middle;
}

.rl-sortable {
	cursor: pointer;
}

.rl-sortable:hover {
	color: #42b983;
}

.rl-sort-arrow {
	margin-left: 4px;
	font-size: 0.7rem;
	color: #42b983;
}

.rl-empty {
	text-align: center;
	color: #6c757d;
	padding: 24px;
}

.rl-row-selectable {
	cursor: pointer;
}

.rl-row-selectable:hover {
	background: #f8f9fa;
}

.rl-row-active,
.rl-row-active:hover {
	background: #e3f2fd;
}

.rl-actions-head,
.rl-actions-filter {
	width: 86px;
}

.rl-actions-buttons {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.rl-icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	padding: 0;
	border: 1px solid transparent;
	border-radius: 4px;
	background: #f1f3f5;
	color: #495057;
	cursor: pointer;
	vertical-align: middle;
}

.rl-icon-btn:hover {
	background: #e2e6ea;
}

.rl-icon-btn-primary {
	background: #1976d2;
	color: #fff;
}

.rl-icon-btn-primary:hover {
	background: #1565c0;
}

.rl-icon-btn-danger {
	background: #fde8e8;
	color: #c62828;
}

.rl-icon-btn-danger:hover {
	background: #f8d7da;
}

.rl-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 0.8rem;
}

.rl-badge-true {
	background: #d4edda;
	color: #155724;
}

.rl-badge-false {
	background: #f8d7da;
	color: #721c24;
}

.rl-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid #eee;
	flex-shrink: 0;
	flex-wrap: wrap;
}

.rl-pagination {
	display: flex;
	align-items: center;
	gap: 12px;
}

.rl-pagination button {
	padding: 6px 12px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
	cursor: pointer;
}

.rl-pagination button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.rl-pagination .rl-filter-toggle {
	width: 34px;
	height: 34px;
	padding: 0;
	background: #f1f3f5;
	border-color: transparent;
	color: #495057;
}

.rl-pagination .rl-filter-toggle:hover {
	background: #e2e6ea;
}

.rl-pagination .rl-filter-toggle-active {
	background: #1976d2;
	border-color: #1976d2;
	color: #fff;
}

.rl-pagination .rl-filter-toggle-active:hover {
	background: #1565c0;
}

.rl-limit {
	padding: 6px 8px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
}
</style>
