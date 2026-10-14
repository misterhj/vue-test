<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
	PAYMENT_METHODS,
	paymentService,
	type Payment,
	type PaymentMethod,
	type PaymentType,
} from '@/services/payments.services'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const rows = ref<Payment[]>([])
const loading = ref(false)
const error = ref('')

const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const limit = ref(15)

const methodFilter = ref<PaymentMethod | ''>('')
const dateFrom = ref('')
const dateTo = ref('')

const canDelete = computed(() => authStore.hasPermission('payments:delete'))

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
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-AR')
}

function methodLabel(method: PaymentMethod): string {
	return PAYMENT_METHODS.find((opt) => opt.value === method)?.label ?? method
}

function typeLabel(type: PaymentType): string {
	return type === 'collection' ? 'Cobro' : 'Pago'
}

function partyName(payment: Payment): string {
	const party = payment.customer ?? payment.supplier
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

function documentLabel(payment: Payment): string {
	if (payment.saleId) {
		return `Venta #${payment.saleId}`
	}
	if (payment.purchaseId) {
		return `Compra #${payment.purchaseId}`
	}
	return '—'
}

async function fetchData(page = 1) {
	loading.value = true
	error.value = ''
	try {
		const res = await paymentService.list({
			search: search.value.trim() || undefined,
			page,
			limit: limit.value,
			method: methodFilter.value || undefined,
			dateFrom: dateFrom.value || undefined,
			dateTo: dateTo.value || undefined,
		})
		rows.value = res.data
		currentPage.value = res.current_page
		lastPage.value = res.last_page
		total.value = res.total
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al cargar los pagos'
		rows.value = []
		total.value = 0
		lastPage.value = 1
	} finally {
		loading.value = false
	}
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
	if (searchTimeout) {
		clearTimeout(searchTimeout)
	}
	searchTimeout = setTimeout(() => fetchData(1), 400)
})

function changeLimit() {
	fetchData(1)
}

function goToPage(page: number) {
	if (page < 1 || page > lastPage.value || page === currentPage.value) {
		return
	}
	fetchData(page)
}

async function removeRow(payment: Payment) {
	if (!window.confirm('¿Estás seguro de eliminar este movimiento?')) {
		return
	}
	try {
		await paymentService.remove(payment.id)
		await fetchData(currentPage.value)
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

onMounted(() => fetchData(1))
</script>

<template>
	<div class="pay-list">
		<div class="pay-header">
			<div>
				<h1>Pagos y Cobros</h1>
				<p class="pay-hint">
					Los cobros y pagos se registran desde una venta o compra confirmada, en las
					pantallas de Ventas y Compras.
				</p>
			</div>
		</div>

		<div class="pay-toolbar">
			<input
				v-model="search"
				type="text"
				class="pay-search"
				placeholder="Buscar por referencia..."
			/>
			<label class="pay-filter">
				<span>Medio</span>
				<select v-model="methodFilter" @change="fetchData(1)">
					<option value="">Todos</option>
					<option v-for="opt in PAYMENT_METHODS" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
			<label class="pay-filter">
				<span>Desde</span>
				<input v-model="dateFrom" type="date" @change="fetchData(1)" />
			</label>
			<label class="pay-filter">
				<span>Hasta</span>
				<input v-model="dateTo" type="date" @change="fetchData(1)" />
			</label>
		</div>

		<div v-if="loading" class="pay-message">Cargando pagos y cobros...</div>
		<div v-else-if="error" class="pay-message pay-error">{{ error }}</div>

		<div v-else class="pay-table-wrap">
			<table class="pay-table">
				<thead>
					<tr>
						<th>Fecha</th>
						<th>Tipo</th>
						<th>Contraparte</th>
						<th>Documento</th>
						<th>Medio</th>
						<th>Referencia</th>
						<th class="pay-right">Monto</th>
						<th v-if="canDelete" class="pay-actions-head">Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.id">
						<td>{{ formatDate(row.date) }}</td>
						<td>
							<span class="pay-badge" :class="`pay-badge-${row.type}`">
								{{ typeLabel(row.type) }}
							</span>
						</td>
						<td>{{ partyName(row) }}</td>
						<td>{{ documentLabel(row) }}</td>
						<td>{{ methodLabel(row.method) }}</td>
						<td>{{ row.reference ?? '—' }}</td>
						<td class="pay-right">{{ money(row.amount) }}</td>
						<td v-if="canDelete" class="pay-actions">
							<button
								class="pay-icon-btn pay-icon-btn-danger"
								title="Eliminar"
								@click="removeRow(row)"
							>
								Eliminar
							</button>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td :colspan="canDelete ? 8 : 7" class="pay-empty">
							No se encontraron movimientos
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="pay-footer">
			<div class="pay-pagination">
				<button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
					Anterior
				</button>
				<span>Página {{ currentPage }} de {{ lastPage }} · {{ total }} movimientos</span>
				<button :disabled="currentPage === lastPage" @click="goToPage(currentPage + 1)">
					Siguiente
				</button>
			</div>
			<select v-model.number="limit" class="pay-limit" @change="changeLimit">
				<option :value="10">10 / pág</option>
				<option :value="15">15 / pág</option>
				<option :value="25">25 / pág</option>
				<option :value="50">50 / pág</option>
			</select>
		</div>
	</div>
</template>

<style scoped>
.pay-list {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: #fff;
	padding: 20px;
	border-radius: 8px;
}

.pay-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	margin-bottom: 12px;
	flex-wrap: wrap;
	flex-shrink: 0;
}

.pay-header h1 {
	margin: 0;
	font-size: 1.4rem;
	color: #2c3e50;
}

.pay-hint {
	margin: 4px 0 0;
	color: #6c757d;
	font-size: 0.85rem;
}

.pay-toolbar {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	align-items: flex-end;
	margin-bottom: 12px;
	flex-shrink: 0;
}

.pay-search {
	flex: 1 1 240px;
	padding: 8px 12px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	font: inherit;
}

.pay-filter {
	display: flex;
	flex-direction: column;
	gap: 4px;
	font-size: 0.8rem;
	color: #6c757d;
}

.pay-filter select,
.pay-filter input {
	padding: 8px 10px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
	font: inherit;
}

.pay-message {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	color: #6c757d;
}

.pay-error {
	color: #dc3545;
}

.pay-table-wrap {
	flex: 1 1 auto;
	min-height: 0;
	width: 100%;
	overflow: auto;
}

.pay-table {
	width: 100%;
	border-collapse: collapse;
}

.pay-table th,
.pay-table td {
	padding: 10px 12px;
	border-bottom: 1px solid #eee;
	text-align: left;
}

.pay-table thead th {
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

.pay-right {
	text-align: right;
}

.pay-actions-head {
	width: 120px;
}

.pay-actions {
	text-align: right;
}

.pay-icon-btn {
	padding: 5px 10px;
	border: none;
	border-radius: 4px;
	background: #f1f3f5;
	color: #495057;
	cursor: pointer;
	font: inherit;
	font-size: 0.85rem;
}

.pay-icon-btn-danger {
	background: #fde8e8;
	color: #c62828;
}

.pay-icon-btn-danger:hover {
	background: #f8d7da;
}

.pay-badge {
	display: inline-block;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 0.8rem;
}

.pay-badge-collection {
	background: #d4edda;
	color: #155724;
}

.pay-badge-payment {
	background: #fff3cd;
	color: #856404;
}

.pay-empty {
	text-align: center;
	color: #6c757d;
	padding: 24px;
}

.pay-footer {
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

.pay-pagination {
	display: flex;
	align-items: center;
	gap: 12px;
}

.pay-pagination button {
	padding: 6px 12px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
	cursor: pointer;
}

.pay-pagination button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.pay-limit {
	padding: 6px 8px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
}
</style>
