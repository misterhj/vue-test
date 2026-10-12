<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
	RESOURCE_LIST_CONFIGS,
	type ResourceListConfig,
} from '@/config/resource-list.config'
import type {
	ResourceListFilterOption,
	ResourceListFilters,
	ResourceListViewColumn,
} from '@/config/resource-list.types'
import { listService, type ListParams } from '@/services/list.services'

type ResourceRow = Record<string, unknown>

const props = defineProps<{ resource: string }>()

const config = computed<ResourceListConfig | undefined>(
	() => RESOURCE_LIST_CONFIGS[props.resource],
)

const rows = ref<ResourceRow[]>([])
const clientRows = ref<ResourceRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const error = ref('')

const search = ref('')
const limit = ref(config.value?.defaultLimit ?? 15)
const sortBy = ref(config.value?.defaultSort?.field ?? 'id')
const sortOrder = ref<'ASC' | 'DESC'>(config.value?.defaultSort?.order ?? 'DESC')

const activeFilters = reactive<Record<string, unknown>>({})
const filterOptions = reactive<
	Record<string, ResourceListFilterOption[]>
>({})

const isClientFiltered = computed(() => Boolean(config.value?.clientFilter))

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

function buildParams(page: number): ListParams {
	return {
		search: search.value.trim() || undefined,
		page,
		limit: limit.value,
		sortBy: sortBy.value,
		sortOrder: sortOrder.value,
		filters: Object.keys(activeFilters).length ? { ...activeFilters } : undefined,
	}
}

async function fetchAllPages(params: ListParams): Promise<ResourceRow[]> {
	const collected: ResourceRow[] = []
	let page = 1
	let last = 1
	const maxPages = 100
	do {
		const res = await listService.getAll<ResourceRow>(props.resource, {
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
		if (isClientFiltered.value) {
			const all = await fetchAllPages({
				search: buildParams(1).search,
				sortBy: sortBy.value,
				sortOrder: sortOrder.value,
				filters: buildParams(1).filters,
			})
			clientRows.value = all.filter((row) => config.value!.clientFilter!(row))
			currentPage.value = 1
			updateClientPagination()
		} else {
			const res = await listService.getAll<ResourceRow>(
				props.resource,
				buildParams(page),
			)
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
	if (isClientFiltered.value) {
		const start = (currentPage.value - 1) * limit.value
		return clientRows.value.slice(start, start + limit.value)
	}
	return rows.value
})

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
	if (searchTimeout) {
		clearTimeout(searchTimeout)
	}
	searchTimeout = setTimeout(() => fetchData(1), 300)
})

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
	if (isClientFiltered.value) {
		currentPage.value = page
		return
	}
	fetchData(page)
}

function changeLimit() {
	currentPage.value = 1
	if (isClientFiltered.value) {
		updateClientPagination()
		return
	}
	fetchData(1)
}

function onSelectFilter(filter: ResourceListFilters, raw: string) {
	if (raw === '') {
		delete activeFilters[filter.key]
	} else {
		const option = (filterOptions[filter.key] ?? []).find(
			(opt) => String(opt.value) === raw,
		)
		activeFilters[filter.key] = option ? option.value : raw
	}
	fetchData(1)
}

function onBooleanFilterChange(filter: ResourceListFilters, event: Event) {
	const checked = (event.target as HTMLInputElement).checked
	if (checked) {
		activeFilters[filter.key] = true
	} else {
		delete activeFilters[filter.key]
	}
	fetchData(1)
}

async function loadFilterOptions() {
	for (const filter of config.value?.filters ?? []) {
		if (filter.options) {
			filterOptions[filter.key] = filter.options
		} else if (filter.optionsResource) {
			const optionLabel = filter.optionLabel ?? 'name'
			try {
				const res = await listService.getAll<ResourceRow>(
					filter.optionsResource,
					{ limit: 100 },
				)
				filterOptions[filter.key] = res.data.map((row) => ({
					value: row.id as number,
					label: String(row[optionLabel] ?? row.name ?? row.id),
				}))
			} catch {
				filterOptions[filter.key] = []
			}
		}
	}
}

const title = computed(() => config.value?.title ?? props.resource)

onMounted(() => {
	loadFilterOptions()
	fetchData(1)
})

onUnmounted(() => {
	if (searchTimeout) {
		clearTimeout(searchTimeout)
	}
})
</script>

<template>
	<div v-if="config" class="resource-list">
		<div class="rl-header">
			<h1>{{ title }}</h1>
			<input
				v-model="search"
				type="text"
				:placeholder="config.searchPlaceholder ?? `Buscar ${title.toLowerCase()}...`"
				class="rl-search"
			/>
		</div>

		<div v-if="config.filters?.length" class="rl-filters">
			<label
				v-for="filter in config.filters"
				:key="filter.key"
				class="rl-filter-item"
			>
				<span>{{ filter.label }}</span>
				<select
					v-if="filter.type === 'select'"
					:value="activeFilters[filter.key] ?? ''"
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
					:checked="Boolean(activeFilters[filter.key])"
					@change="onBooleanFilterChange(filter, $event)"
				/>
			</label>
		</div>

		<div v-if="loading" class="rl-message">Cargando {{ title.toLowerCase() }}...</div>
		<div v-else-if="error" class="rl-message rl-error">{{ error }}</div>

		<table v-else class="rl-table">
			<thead>
				<tr>
					<th
						v-for="col in config.columns"
						:key="col.key"
						:class="{ 'rl-sortable': col.sortable }"
						:style="col.align ? { textAlign: col.align } : undefined"
						@click="col.sortable && toggleSort(col.key)"
					>
						<span>{{ col.label }}</span>
						<span v-if="col.sortable && sortBy === col.key" class="rl-sort-arrow">
							{{ sortOrder === 'ASC' ? '▲' : '▼' }}
						</span>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in displayRows" :key="String(row.id)">
					<td
						v-for="col in config.columns"
						:key="col.key"
						:style="col.align ? { textAlign: col.align } : undefined"
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
					<td :colspan="config.columns.length" class="rl-empty">
						No se encontraron registros
					</td>
				</tr>
			</tbody>
		</table>

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
			</div>
			<select v-model.number="limit" class="rl-limit" @change="changeLimit">
				<option :value="10">10 / pág</option>
				<option :value="15">15 / pág</option>
				<option :value="25">25 / pág</option>
				<option :value="50">50 / pág</option>
				<option :value="100">100 / pág</option>
			</select>
		</div>
	</div>
</template>

<style scoped>
.resource-list {
	background: #fff;
	padding: 20px;
	border-radius: 8px;
}

.rl-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 16px;
	flex-wrap: wrap;
}

.rl-header h1 {
	margin: 0;
	font-size: 1.4rem;
	color: #2c3e50;
}

.rl-search {
	padding: 8px 12px;
	border: 1px solid #ccc;
	border-radius: 4px;
	width: 320px;
	max-width: 100%;
}

.rl-filters {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	margin-bottom: 16px;
	padding: 12px;
	background: #f8f9fa;
	border-radius: 6px;
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
	padding: 24px;
	text-align: center;
	color: #6c757d;
}

.rl-error {
	color: #dc3545;
}

.rl-table {
	width: 100%;
	border-collapse: collapse;
}

.rl-table th,
.rl-table td {
	padding: 10px 12px;
	border-bottom: 1px solid #eee;
	text-align: left;
}

.rl-table th {
	color: #6c757d;
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	user-select: none;
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
	margin-top: 16px;
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

.rl-limit {
	padding: 6px 8px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
}
</style>