<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DocumentFormModal from './DocumentFormModal.vue'
import { listService } from '@/services/list.services'
import type { OptionItem } from '@/services/list.services'
import {
	purchaseService,
	type Purchase,
} from '@/services/purchases.services'
import { saleService, type Sale } from '@/services/sales.services'
import { useAuthStore } from '@/stores/auth'
import type {
	DocumentFormInitial,
	DocumentFormPayload,
	DocumentLineInput,
	DocumentParty,
	DocumentStatus,
} from '@/services/documents.types'
import {
	DOCUMENT_LIST_CONFIGS,
	type DocumentKind,
} from '@/config/document-list.config'
import PaymentFormModal from './PaymentFormModal.vue'
import {
	paymentService,
	type PaymentInput,
	type PaymentStatus,
	type PaymentSummary,
} from '@/services/payments.services'

const props = defineProps<{
	document: DocumentKind
}>()

const authStore = useAuthStore()
const config = computed(() => DOCUMENT_LIST_CONFIGS[props.document])
const prefix = computed(() => config.value.permissionPrefix)

interface Row {
	id: number
	number: string | null
	partyId: number | null
	partyName: string
	date: string
	status: DocumentStatus
	subtotal: number
	discountTotal: number
	total: number
	notes: string | null
	items: DocumentLineInput[]
}

function isPurchase(record: Purchase | Sale): record is Purchase {
	return 'supplier' in record
}

function partyDisplayName(party: DocumentParty | null | undefined): string {
	if (!party) {
		return '—'
	}
	if (party.displayName) {
		return party.displayName
	}
	const business = party.businessName?.trim()
	if (business) {
		return business
	}
	const full = [party.firstName, party.lastName].filter(Boolean).join(' ').trim()
	return full || `#${party.id}`
}

function normalize(record: Purchase | Sale): Row {
	const party = isPurchase(record) ? record.supplier : record.customer
	const items = isPurchase(record)
		? record.items.map((item) => ({
				productId: item.productId ?? 0,
				quantity: item.quantity,
				unit: item.unitCost,
				discount: item.discount,
			}))
		: record.items.map((item) => ({
				productId: item.productId ?? 0,
				quantity: item.quantity,
				unit: item.unitPrice,
				discount: item.discount,
			}))

	return {
		id: record.id,
		number: record.number,
		partyId: party?.id ?? null,
		partyName: partyDisplayName(party),
		date: record.date,
		status: record.status,
		subtotal: record.subtotal,
		discountTotal: record.discountTotal,
		total: record.total,
		notes: record.notes,
		items,
	}
}

const rows = ref<Row[]>([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const limit = ref(15)
const sortBy = ref('id')
const sortOrder = ref<'ASC' | 'DESC'>('DESC')

const statusFilter = ref('')
const partyIdFilter = ref<number | ''>('')
const partyOptions = ref<OptionItem[]>([])

const statusOptions: Array<{ value: DocumentStatus; label: string }> = [
	{ value: 'draft', label: 'Borrador' },
	{ value: 'confirmed', label: 'Confirmada' },
	{ value: 'cancelled', label: 'Cancelada' },
]

const showFormModal = ref(false)
const editingRow = ref<Row | null>(null)
const formSaving = ref(false)
const formError = ref('')

const canCreate = computed(() => authStore.hasPermission(`${prefix.value}:create`))
const canUpdate = computed(() => authStore.hasPermission(`${prefix.value}:update`))
const canDelete = computed(() => authStore.hasPermission(`${prefix.value}:delete`))
const canConfirm = computed(() => authStore.hasPermission(`${prefix.value}:confirm`))

function canEdit(row: Row): boolean {
	return row.status === 'draft' && canUpdate.value
}
function canRemove(row: Row): boolean {
	return row.status === 'draft' && canDelete.value
}
function canConfirmRow(row: Row): boolean {
	return row.status === 'draft' && canConfirm.value
}
function canCancelRow(row: Row): boolean {
	return row.status !== 'cancelled' && canConfirm.value
}

const hasActions = computed(
	() => canCreate.value || canUpdate.value || canDelete.value || canConfirm.value,
)

const showPayments = computed(() => authStore.hasPermission('payments:read'))
const canPay = computed(() => authStore.hasPermission('payments:create'))
const isPurchaseDoc = computed(() => props.document === 'purchases')

const payVerb = computed(() => (isPurchaseDoc.value ? 'Pagar' : 'Cobrar'))
const payNoun = computed(() => (isPurchaseDoc.value ? 'Pago' : 'Cobro'))

const summaries = ref<Record<number, PaymentSummary>>({})
let summaryReqId = 0

const payTarget = ref<Row | null>(null)
const paySaving = ref(false)
const payError = ref('')

const colCount = computed(
	() => 5 + (showPayments.value ? 1 : 0) + (hasActions.value ? 1 : 0),
)

function paymentStatusLabel(status: PaymentStatus | undefined): string {
	if (status === 'paid') {
		return isPurchaseDoc.value ? 'Pagada' : 'Cobrada'
	}
	if (status === 'partial') {
		return 'Parcial'
	}
	return 'Pendiente'
}

function rowPayment(row: Row): PaymentSummary | undefined {
	return summaries.value[row.id]
}

function canRegisterPayment(row: Row): boolean {
	const summary = summaries.value[row.id]
	return row.status === 'confirmed' && canPay.value && !!summary && summary.balanceDue > 0
}

function documentLabel(row: Row): string {
	const noun = isPurchaseDoc.value ? 'Compra' : 'Venta'
	return `${noun} ${row.number ? `#${row.number}` : `#${row.id}`}`
}

async function loadSummaries(list: Row[]) {
	const requestId = ++summaryReqId
	const confirmed = list.filter((row) => row.status === 'confirmed')
	const next: Record<number, PaymentSummary> = {}
	await Promise.allSettled(
		confirmed.map(async (row) => {
			try {
				next[row.id] = await paymentService.summary(
					isPurchaseDoc.value ? { purchaseId: row.id } : { saleId: row.id },
				)
			} catch {
				// sin saldo disponible: se omite el badge
			}
		}),
	)
	if (requestId === summaryReqId) {
		summaries.value = next
	}
}

function openPay(row: Row) {
	payTarget.value = row
	payError.value = ''
}

function closePay() {
	payTarget.value = null
	payError.value = ''
}

async function handlePay(payload: PaymentInput) {
	paySaving.value = true
	payError.value = ''
	try {
		await paymentService.create(payload)
		closePay()
		await fetchData(currentPage.value)
	} catch (err: unknown) {
		payError.value = (err as { message?: string })?.message ?? 'Error al registrar el movimiento'
	} finally {
		paySaving.value = false
	}
}

function money(value: number): string {
	return `$${Number(value).toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function formatDate(value: string): string {
	if (!value) {
		return '—'
	}
	const date = new Date(value)
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleDateString('es-AR')
}

function statusLabel(status: DocumentStatus): string {
	return config.value.statusLabels[status] ?? status
}

function partyName(row: Record<string, unknown>): string {
	const business = row.businessName as string | undefined
	if (business) {
		return business
	}
	const full = [row.firstName, row.lastName].filter(Boolean).join(' ').trim()
	return full || `#${row.id}`
}

function collectFilters(): Record<string, unknown> | undefined {
	const filters: Record<string, unknown> = {}
	if (statusFilter.value) {
		filters.status = statusFilter.value
	}
	if (partyIdFilter.value !== '' && partyIdFilter.value !== null) {
		filters[config.value.partyKey] = partyIdFilter.value
	}
	return Object.keys(filters).length ? filters : undefined
}

async function fetchData(page = 1) {
	loading.value = true
	error.value = ''
	try {
		const params = {
			search: search.value.trim() || undefined,
			page,
			limit: limit.value,
			sortBy: sortBy.value,
			sortOrder: sortOrder.value,
			filters: collectFilters(),
		}
		const res =
			props.document === 'purchases'
				? await purchaseService.getAll(params)
				: await saleService.getAll(params)
		rows.value = (res.data as Array<Purchase | Sale>).map(normalize)
		currentPage.value = res.current_page
		lastPage.value = res.last_page
		total.value = res.total
		summaries.value = {}
		if (showPayments.value) {
			void loadSummaries(rows.value)
		}
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al cargar los datos'
		rows.value = []
		total.value = 0
		lastPage.value = 1
	} finally {
		loading.value = false
	}
}

async function loadPartyOptions() {
	try {
		const res = await listService.getAll<Record<string, unknown>>('customers', {
			limit: 100,
			filters: config.value.partyFilter,
		})
		partyOptions.value = res.data.map((row) => ({
			value: row.id as number,
			label: partyName(row),
		}))
	} catch {
		partyOptions.value = []
	}
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
	if (searchTimeout) {
		clearTimeout(searchTimeout)
	}
	searchTimeout = setTimeout(() => fetchData(1), 400)
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

function changeLimit() {
	fetchData(1)
}

function goToPage(page: number) {
	if (page < 1 || page > lastPage.value || page === currentPage.value) {
		return
	}
	fetchData(page)
}

const formInitial = computed<DocumentFormInitial | undefined>(() => {
	const row = editingRow.value
	if (!row) {
		return undefined
	}
	return {
		partyId: row.partyId ?? '',
		date: row.date,
		notes: row.notes ?? '',
		items: row.items,
	}
})

const modalTitle = computed(() =>
	editingRow.value
		? `Editar ${config.value.title.slice(0, -1)}`
		: `Nueva ${config.value.title.slice(0, -1)}`,
)

function openCreate() {
	editingRow.value = null
	formError.value = ''
	showFormModal.value = true
}

function openEdit(row: Row) {
	editingRow.value = row
	formError.value = ''
	showFormModal.value = true
}

function closeModal() {
	showFormModal.value = false
	editingRow.value = null
	formError.value = ''
}

async function handleSave(payload: DocumentFormPayload) {
	formSaving.value = true
	formError.value = ''
	try {
		if (props.document === 'purchases') {
			const input = {
				supplierId: payload.partyId,
				date: payload.date,
				notes: payload.notes || undefined,
				items: payload.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitCost: item.unit,
					discount: item.discount,
				})),
			}
			if (editingRow.value) {
				await purchaseService.update(editingRow.value.id, input)
			} else {
				await purchaseService.create(input)
			}
		} else {
			const input = {
				customerId: payload.partyId,
				date: payload.date,
				notes: payload.notes || undefined,
				items: payload.items.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unit,
					discount: item.discount,
				})),
			}
			if (editingRow.value) {
				await saleService.update(editingRow.value.id, input)
			} else {
				await saleService.create(input)
			}
		}
		closeModal()
		await fetchData(currentPage.value)
	} catch (err: unknown) {
		formError.value = (err as { message?: string })?.message ?? 'Error al guardar'
	} finally {
		formSaving.value = false
	}
}

async function changeStatus(row: Row, action: 'confirm' | 'cancel') {
	const label = action === 'confirm' ? 'confirmar' : 'cancelar'
	if (!window.confirm(`¿Estás seguro de ${label} este documento?`)) {
		return
	}
	try {
		if (props.document === 'purchases') {
			if (action === 'confirm') {
				await purchaseService.confirm(row.id)
			} else {
				await purchaseService.cancel(row.id)
			}
		} else if (action === 'confirm') {
			await saleService.confirm(row.id)
		} else {
			await saleService.cancel(row.id)
		}
		await fetchData(currentPage.value)
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al actualizar el documento')
	}
}

async function removeRow(row: Row) {
	if (!window.confirm('¿Estás seguro de eliminar este documento?')) {
		return
	}
	try {
		if (props.document === 'purchases') {
			await purchaseService.remove(row.id)
		} else {
			await saleService.remove(row.id)
		}
		await fetchData(currentPage.value)
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

function initialize() {
	search.value = ''
	statusFilter.value = ''
	partyIdFilter.value = ''
	sortBy.value = 'id'
	sortOrder.value = 'DESC'
	currentPage.value = 1
	rows.value = []
	fetchData(1)
	loadPartyOptions()
}

onMounted(initialize)
watch(() => props.document, initialize)
</script>

<template>
	<div class="doc-list">
		<div class="doc-header">
			<h1>{{ config.title }}</h1>
			<button v-if="canCreate" class="doc-btn doc-btn-primary" @click="openCreate">
				+ Nueva
			</button>
		</div>

		<div class="doc-toolbar">
			<input
				v-model="search"
				type="text"
				class="doc-search"
				:placeholder="config.searchPlaceholder"
			/>
			<label class="doc-filter">
				<span>Estado</span>
				<select v-model="statusFilter" @change="fetchData(1)">
					<option value="">Todos</option>
					<option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
						{{ statusLabel(opt.value) }}
					</option>
				</select>
			</label>
			<label class="doc-filter">
				<span>{{ config.partyLabel }}</span>
				<select v-model.number="partyIdFilter" @change="fetchData(1)">
					<option value="">Todos</option>
					<option v-for="opt in partyOptions" :key="String(opt.value)" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
		</div>

		<div v-if="loading" class="doc-message">Cargando {{ config.title.toLowerCase() }}...</div>
		<div v-else-if="error" class="doc-message doc-error">{{ error }}</div>

		<div v-else class="doc-table-wrap">
			<table class="doc-table">
				<thead>
					<tr>
						<th class="doc-sortable" @click="toggleSort('number')">
							Número
							<span v-if="sortBy === 'number'" class="doc-sort-arrow">
								{{ sortOrder === 'ASC' ? '▲' : '▼' }}
							</span>
						</th>
						<th>{{ config.partyLabel }}</th>
						<th class="doc-sortable" @click="toggleSort('date')">
							Fecha
							<span v-if="sortBy === 'date'" class="doc-sort-arrow">
								{{ sortOrder === 'ASC' ? '▲' : '▼' }}
							</span>
						</th>
						<th>Estado</th>
						<th v-if="showPayments">{{ payNoun }}</th>
						<th class="doc-right doc-sortable" @click="toggleSort('total')">
							Total
							<span v-if="sortBy === 'total'" class="doc-sort-arrow">
								{{ sortOrder === 'ASC' ? '▲' : '▼' }}
							</span>
						</th>
						<th v-if="hasActions" class="doc-actions-head">Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.id">
						<td>{{ row.number ?? '—' }}</td>
						<td>{{ row.partyName }}</td>
						<td>{{ formatDate(row.date) }}</td>
						<td>
							<span class="doc-badge" :class="`doc-badge-${row.status}`">
								{{ statusLabel(row.status) }}
							</span>
						</td>
						<td v-if="showPayments" class="doc-payments">
							<template v-if="row.status === 'confirmed'">
								<template v-if="rowPayment(row)">
									<span
										class="doc-badge"
										:class="`doc-pay-${rowPayment(row)?.status}`"
									>
										{{ paymentStatusLabel(rowPayment(row)?.status) }}
									</span>
									<button
										v-if="canRegisterPayment(row)"
										class="doc-icon-btn doc-icon-btn-pay"
										:title="`${payVerb} ${money(rowPayment(row)?.balanceDue ?? 0)}`"
										@click="openPay(row)"
									>
										{{ payVerb }}
									</button>
								</template>
								<span v-else class="doc-pay-loading">…</span>
							</template>
							<span v-else>—</span>
						</td>
						<td class="doc-right">{{ money(row.total) }}</td>
						<td v-if="hasActions" class="doc-actions">
							<div class="doc-actions-buttons">
								<button
									v-if="canEdit(row)"
									class="doc-icon-btn"
									title="Editar"
									aria-label="Editar"
									@click="openEdit(row)"
								>
									Editar
								</button>
								<button
									v-if="canConfirmRow(row)"
									class="doc-icon-btn doc-icon-btn-confirm"
									title="Confirmar"
									@click="changeStatus(row, 'confirm')"
								>
									Confirmar
								</button>
								<button
									v-if="canCancelRow(row)"
									class="doc-icon-btn"
									title="Cancelar"
									@click="changeStatus(row, 'cancel')"
								>
									Cancelar
								</button>
								<button
									v-if="canRemove(row)"
									class="doc-icon-btn doc-icon-btn-danger"
									title="Eliminar"
									@click="removeRow(row)"
								>
									Eliminar
								</button>
							</div>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td :colspan="colCount" class="doc-empty">
							No se encontraron registros
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="doc-footer">
			<div class="doc-pagination">
				<button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
					Anterior
				</button>
				<span>Página {{ currentPage }} de {{ lastPage }} · {{ total }} registros</span>
				<button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)">
					Siguiente
				</button>
			</div>
			<select v-model.number="limit" class="doc-limit" @change="changeLimit">
				<option :value="10">10 / pág</option>
				<option :value="15">15 / pág</option>
				<option :value="25">25 / pág</option>
				<option :value="50">50 / pág</option>
			</select>
		</div>

		<DocumentFormModal
			v-if="showFormModal"
			:title="modalTitle"
			:party-label="config.partyLabel"
			:party-options="partyOptions"
			:unit-label="config.unitLabel"
			:initial="formInitial"
			:saving="formSaving"
			:error="formError"
			@save="handleSave"
			@close="closeModal"
		/>

		<PaymentFormModal
			v-if="payTarget"
			:mode="isPurchaseDoc ? 'purchase' : 'sale'"
			:document-id="payTarget.id"
			:document-label="documentLabel(payTarget)"
			:party-label="config.partyLabel"
			:party-name="payTarget.partyName"
			:saving="paySaving"
			:error="payError"
			@save="handlePay"
			@close="closePay"
		/>
	</div>
</template>

<style scoped>
.doc-list {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: #fff;
	padding: 20px;
	border-radius: 8px;
}

.doc-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 12px;
	flex-wrap: wrap;
	flex-shrink: 0;
}

.doc-header h1 {
	margin: 0;
	font-size: 1.4rem;
	color: #2c3e50;
}

.doc-toolbar {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	align-items: flex-end;
	margin-bottom: 12px;
	flex-shrink: 0;
}

.doc-search {
	flex: 1 1 260px;
	padding: 8px 12px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	font: inherit;
}

.doc-filter {
	display: flex;
	flex-direction: column;
	gap: 4px;
	font-size: 0.8rem;
	color: #6c757d;
}

.doc-filter select {
	padding: 8px 10px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
	font: inherit;
}

.doc-btn {
	padding: 8px 16px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	font: inherit;
}

.doc-btn-primary {
	background: #1976d2;
	color: #fff;
}

.doc-message {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	color: #6c757d;
}

.doc-error {
	color: #dc3545;
}

.doc-table-wrap {
	flex: 1 1 auto;
	min-height: 0;
	width: 100%;
	overflow: auto;
}

.doc-table {
	width: 100%;
	border-collapse: collapse;
}

.doc-table th,
.doc-table td {
	padding: 10px 12px;
	border-bottom: 1px solid #eee;
	text-align: left;
}

.doc-table thead th {
	position: sticky;
	top: 0;
	background: #fff;
	white-space: nowrap;
	color: #6c757d;
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	z-index: 1;
}

.doc-sortable {
	cursor: pointer;
	user-select: none;
}

.doc-sortable:hover {
	color: #42b983;
}

.doc-sort-arrow {
	margin-left: 4px;
	font-size: 0.7rem;
	color: #42b983;
}

.doc-right {
	text-align: right;
}

.doc-actions-head {
	width: 240px;
}

.doc-actions-buttons {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.doc-icon-btn {
	padding: 5px 10px;
	border: none;
	border-radius: 4px;
	background: #f1f3f5;
	color: #495057;
	cursor: pointer;
	font: inherit;
	font-size: 0.85rem;
}

.doc-icon-btn:hover {
	background: #e2e6ea;
}

.doc-icon-btn-confirm {
	background: #d4edda;
	color: #155724;
}

.doc-icon-btn-confirm:hover {
	background: #c3e6cb;
}

.doc-icon-btn-danger {
	background: #fde8e8;
	color: #c62828;
}

.doc-icon-btn-danger:hover {
	background: #f8d7da;
}

.doc-icon-btn-pay {
	background: #e7f1fd;
	color: #1565c0;
}

.doc-icon-btn-pay:hover {
	background: #d3e6fb;
}

.doc-payments {
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
}

.doc-pay-loading {
	color: #adb5bd;
}

.doc-pay-pending {
	background: #e9ecef;
	color: #495057;
}

.doc-pay-partial {
	background: #fff3cd;
	color: #856404;
}

.doc-pay-paid {
	background: #d4edda;
	color: #155724;
}

.doc-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 0.8rem;
}

.doc-badge-draft {
	background: #fff3cd;
	color: #856404;
}

.doc-badge-confirmed {
	background: #d4edda;
	color: #155724;
}

.doc-badge-cancelled {
	background: #f8d7da;
	color: #721c24;
}

.doc-empty {
	text-align: center;
	color: #6c757d;
	padding: 24px;
}

.doc-footer {
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

.doc-pagination {
	display: flex;
	align-items: center;
	gap: 12px;
}

.doc-pagination button {
	padding: 6px 12px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
	cursor: pointer;
}

.doc-pagination button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.doc-limit {
	padding: 6px 8px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
}
</style>
