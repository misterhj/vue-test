<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
	QUOTE_STATUSES,
	crmService,
	optionLabel,
	type Quote,
	type QuoteFormInitial,
	type QuoteInput,
	type QuoteStatus,
} from '@/services/crm.services'
import { useCrmList } from '@/composables/useCrmList'
import { clearOptionsCache } from '@/services/list.services'
import { useAuthStore } from '@/stores/auth'
import QuoteFormModal from '@/components/crm/QuoteFormModal.vue'
import '@/components/crm/crm.css'

const authStore = useAuthStore()

const search = ref('')
const statusFilter = ref('')

const { rows, loading, error, page, lastPage, total, limit, apply, goToPage, changeLimit } =
	useCrmList<Quote>((params) => crmService.listQuotes(params))

function filters(): Record<string, unknown> {
	return {
		search: search.value.trim() || undefined,
		status: statusFilter.value || undefined,
	}
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
	if (searchTimer) {
		clearTimeout(searchTimer)
	}
	searchTimer = setTimeout(() => apply(filters()), 400)
})

const canCreate = computed(() => authStore.hasPermission('crm:create'))
const canUpdate = computed(() => authStore.hasPermission('crm:update'))
const canDelete = computed(() => authStore.hasPermission('crm:delete'))

function money(value: number): string {
	return `$${Number(value).toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function formatDate(value: string | null): string {
	if (!value) {
		return '—'
	}
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-AR')
}

function statusClass(status: QuoteStatus): string {
	const map: Record<QuoteStatus, string> = {
		draft: 'crm-badge--gray',
		sent: 'crm-badge--blue',
		accepted: 'crm-badge--green',
		rejected: 'crm-badge--red',
		expired: 'crm-badge--amber',
	}
	return map[status] ?? 'crm-badge--gray'
}

const showForm = ref(false)
const editing = ref<Quote | null>(null)
const formSaving = ref(false)
const formError = ref('')

const formTitle = computed(() => (editing.value ? `Editar cotización ${editing.value.number ?? ''}`.trim() : 'Nueva cotización'))

const formInitial = computed<QuoteFormInitial | undefined>(() => {
	const quote = editing.value
	if (!quote) {
		return undefined
	}
	return {
		customerId: quote.customerId ?? null,
		opportunityId: quote.opportunityId ?? null,
		date: quote.date,
		validUntil: quote.validUntil ?? '',
		notes: quote.notes ?? '',
		items: quote.items.map((item) => ({
			productId: item.productId ?? 0,
			description: item.description ?? '',
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			discount: item.discount,
		})),
	}
})

function openCreate() {
	editing.value = null
	formError.value = ''
	showForm.value = true
}

function openEdit(quote: Quote) {
	editing.value = quote
	formError.value = ''
	showForm.value = true
}

function closeForm() {
	showForm.value = false
	editing.value = null
	formError.value = ''
}

async function save(payload: QuoteInput) {
	formSaving.value = true
	formError.value = ''
	try {
		if (editing.value) {
			await crmService.updateQuote(editing.value.id, payload)
		} else {
			await crmService.createQuote(payload)
		}
		closeForm()
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		formError.value = (err as { message?: string })?.message ?? 'Error al guardar'
	} finally {
		formSaving.value = false
	}
}

async function action(quote: Quote, kind: 'send' | 'accept' | 'reject') {
	try {
		if (kind === 'send') {
			await crmService.sendQuote(quote.id)
		} else if (kind === 'accept') {
			await crmService.acceptQuote(quote.id)
		} else {
			await crmService.rejectQuote(quote.id)
		}
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al actualizar la cotización')
	}
}

async function convert(quote: Quote) {
	if (!window.confirm(`¿Convertir la cotización ${quote.number ?? ''} en una venta?`)) {
		return
	}
	try {
		const result = await crmService.convertQuote(quote.id)
		window.alert(`Venta generada: ${result.sale.number ?? `#${result.sale.id}`}`)
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al convertir')
	}
}

async function remove(quote: Quote) {
	if (!window.confirm(`¿Eliminar la cotización ${quote.number ?? `#${quote.id}`}?`)) {
		return
	}
	try {
		await crmService.removeQuote(quote.id)
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

onMounted(() => apply(filters()))
</script>

<template>
	<div class="crm-page">
		<div class="crm-header">
			<div>
				<h1>Cotizaciones</h1>
				<p class="crm-hint">Propuestas con ítems que pueden convertirse en ventas.</p>
			</div>
			<button v-if="canCreate" class="crm-btn crm-btn-primary crm-btn-lg" @click="openCreate()">
				+ Nueva cotización
			</button>
		</div>

		<div class="crm-toolbar">
			<input v-model="search" type="text" class="crm-search" placeholder="Buscar por número..." />
			<label class="crm-filter">
				<span>Estado</span>
				<select v-model="statusFilter" @change="apply(filters())">
					<option value="">Todos</option>
					<option v-for="opt in QUOTE_STATUSES" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
		</div>

		<div v-if="loading" class="crm-message">Cargando cotizaciones...</div>
		<div v-else-if="error" class="crm-message crm-error">{{ error }}</div>

		<div v-else class="crm-table-wrap">
			<table class="crm-table">
				<thead>
					<tr>
						<th>Número</th>
						<th>Cliente</th>
						<th>Fecha</th>
						<th>Válida hasta</th>
						<th>Estado</th>
						<th class="crm-right">Total</th>
						<th class="crm-actions-head">Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="quote in rows" :key="quote.id">
						<td>{{ quote.number ?? `#${quote.id}` }}</td>
						<td>{{ quote.customer?.displayName ?? '—' }}</td>
						<td>{{ formatDate(quote.date) }}</td>
						<td>{{ formatDate(quote.validUntil) }}</td>
						<td>
							<span class="crm-badge" :class="statusClass(quote.status)">
								{{ optionLabel(QUOTE_STATUSES, quote.status) }}
							</span>
						</td>
						<td class="crm-num">{{ money(quote.total) }}</td>
						<td class="crm-actions">
							<button
								v-if="canUpdate && quote.status === 'draft'"
								class="crm-btn crm-btn-primary"
								@click="action(quote, 'send')"
							>
								Enviar
							</button>
							<button
								v-if="canUpdate && quote.status === 'sent'"
								class="crm-btn crm-btn-success"
								@click="action(quote, 'accept')"
							>
								Aceptar
							</button>
							<button
								v-if="canUpdate && quote.status === 'sent'"
								class="crm-btn"
								@click="action(quote, 'reject')"
							>
								Rechazar
							</button>
							<button
								v-if="canUpdate && quote.status === 'accepted'"
								class="crm-btn crm-btn-success"
								@click="convert(quote)"
							>
								Convertir a venta
							</button>
							<button
								v-if="canUpdate && quote.status !== 'accepted'"
								class="crm-btn crm-btn-primary"
								@click="openEdit(quote)"
							>
								Editar
							</button>
							<button v-if="canDelete" class="crm-btn crm-btn-danger" @click="remove(quote)">
								Eliminar
							</button>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td colspan="7" class="crm-empty">No se encontraron cotizaciones</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="crm-footer">
			<div class="crm-pagination">
				<button :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button>
				<span>Página {{ page }} de {{ lastPage }} · {{ total }} cotizaciones</span>
				<button :disabled="page === lastPage" @click="goToPage(page + 1)">Siguiente</button>
			</div>
			<select v-model.number="limit" class="crm-limit" @change="changeLimit()">
				<option :value="10">10 / pág</option>
				<option :value="15">15 / pág</option>
				<option :value="25">25 / pág</option>
				<option :value="50">50 / pág</option>
			</select>
		</div>

		<QuoteFormModal
			v-if="showForm"
			:title="formTitle"
			:initial="formInitial"
			:saving="formSaving"
			:error="formError"
			@save="save"
			@close="closeForm"
		/>
	</div>
</template>
