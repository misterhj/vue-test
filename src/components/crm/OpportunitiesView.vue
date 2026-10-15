<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
	OPPORTUNITY_STAGES,
	crmService,
	optionLabel,
	type Opportunity,
	type OpportunityInput,
	type OpportunityStage,
} from '@/services/crm.services'
import { useCrmList } from '@/composables/useCrmList'
import { clearOptionsCache } from '@/services/list.services'
import { useAuthStore } from '@/stores/auth'
import ResourceFormModal from '@/components/ResourceFormModal.vue'
import type { ResourceFormField } from '@/config/resource-list.types'
import '@/components/crm/crm.css'

const authStore = useAuthStore()

const search = ref('')
const stageFilter = ref('')

const { rows, loading, error, page, lastPage, total, limit, apply, goToPage, changeLimit } =
	useCrmList<Opportunity>((params) => crmService.listOpportunities(params))

function filters(): Record<string, unknown> {
	return {
		search: search.value.trim() || undefined,
		stage: stageFilter.value || undefined,
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

function num(value: unknown): number | undefined {
	return value !== undefined && value !== null && value !== '' ? Number(value) : undefined
}

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

function stageClass(stage: OpportunityStage): string {
	const map: Record<OpportunityStage, string> = {
		qualification: 'crm-badge--gray',
		proposal: 'crm-badge--blue',
		negotiation: 'crm-badge--amber',
		won: 'crm-badge--green',
		lost: 'crm-badge--red',
	}
	return map[stage] ?? 'crm-badge--gray'
}

const formFields: ResourceFormField[] = [
	{ key: 'title', label: 'Título', type: 'text', required: true, maxLength: 150 },
	{ key: 'amount', label: 'Monto estimado', type: 'number', min: 0, step: 0.01 },
	{ key: 'stage', label: 'Etapa', type: 'select', defaultValue: 'qualification', options: OPPORTUNITY_STAGES },
	{ key: 'probability', label: 'Probabilidad (%)', type: 'number', min: 0, max: 100, step: 1 },
	{ key: 'expectedCloseDate', label: 'Cierre esperado', type: 'date' },
	{ key: 'customerId', label: 'Cliente', type: 'select', optionsResource: 'customers' },
	{ key: 'leadId', label: 'Lead de origen', type: 'select', optionsResource: 'crm-leads' },
	{
		key: 'assignedToId',
		label: 'Responsable',
		type: 'select',
		optionsResource: 'users',
	},
	{ key: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
]

const showForm = ref(false)
const editing = ref<Opportunity | null>(null)
const formSaving = ref(false)
const formError = ref('')

const formTitle = computed(() => (editing.value ? 'Editar oportunidad' : 'Nueva oportunidad'))

const formInitial = computed<Record<string, unknown> | undefined>(() => {
	const opp = editing.value
	if (!opp) {
		return undefined
	}
	return {
		title: opp.title,
		amount: opp.amount,
		stage: opp.stage,
		probability: opp.probability,
		expectedCloseDate: opp.expectedCloseDate ?? '',
		customerId: opp.customerId ?? '',
		leadId: opp.leadId ?? '',
		assignedToId: opp.assignedToId ?? '',
		notes: opp.notes ?? '',
	}
})

function toPayload(payload: Record<string, unknown>): OpportunityInput {
	return {
		title: String(payload.title ?? ''),
		leadId: num(payload.leadId),
		customerId: num(payload.customerId),
		amount: num(payload.amount),
		stage: (payload.stage as OpportunityStage) || undefined,
		probability: num(payload.probability),
		expectedCloseDate: (payload.expectedCloseDate as string) || undefined,
		assignedToId: num(payload.assignedToId),
		notes: (payload.notes as string) || undefined,
	}
}

function openCreate() {
	editing.value = null
	formError.value = ''
	showForm.value = true
}

function openEdit(opp: Opportunity) {
	editing.value = opp
	formError.value = ''
	showForm.value = true
}

function closeForm() {
	showForm.value = false
	editing.value = null
	formError.value = ''
}

async function save(payload: Record<string, unknown>) {
	formSaving.value = true
	formError.value = ''
	try {
		const data = toPayload(payload)
		if (editing.value) {
			await crmService.updateOpportunity(editing.value.id, data)
		} else {
			await crmService.createOpportunity(data)
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

async function setStage(opp: Opportunity, stage: OpportunityStage) {
	try {
		await crmService.updateOpportunity(opp.id, { stage })
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al actualizar la etapa')
	}
}

async function remove(opp: Opportunity) {
	if (!window.confirm(`¿Eliminar la oportunidad "${opp.title}"?`)) {
		return
	}
	try {
		await crmService.removeOpportunity(opp.id)
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
				<h1>Oportunidades</h1>
				<p class="crm-hint">Pipeline comercial: calificación → propuesta → negociación → cierre.</p>
			</div>
			<button v-if="canCreate" class="crm-btn crm-btn-primary crm-btn-lg" @click="openCreate()">
				+ Nueva oportunidad
			</button>
		</div>

		<div class="crm-toolbar">
			<input v-model="search" type="text" class="crm-search" placeholder="Buscar por título..." />
			<label class="crm-filter">
				<span>Etapa</span>
				<select v-model="stageFilter" @change="apply(filters())">
					<option value="">Todas</option>
					<option v-for="opt in OPPORTUNITY_STAGES" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
		</div>

		<div v-if="loading" class="crm-message">Cargando oportunidades...</div>
		<div v-else-if="error" class="crm-message crm-error">{{ error }}</div>

		<div v-else class="crm-table-wrap">
			<table class="crm-table">
				<thead>
					<tr>
						<th>Título</th>
						<th>Cliente</th>
						<th class="crm-right">Monto</th>
						<th>Etapa</th>
						<th class="crm-right">Prob.</th>
						<th>Cierre esperado</th>
						<th>Creado</th>
						<th class="crm-actions-head">Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="opp in rows" :key="opp.id">
						<td>{{ opp.title }}</td>
						<td>{{ opp.customer?.displayName ?? '—' }}</td>
						<td class="crm-num">{{ money(opp.amount) }}</td>
						<td>
							<span class="crm-badge" :class="stageClass(opp.stage)">
								{{ optionLabel(OPPORTUNITY_STAGES, opp.stage) }}
							</span>
						</td>
						<td class="crm-num">{{ opp.probability }}%</td>
						<td>{{ formatDate(opp.expectedCloseDate) }}</td>
						<td>{{ formatDate(opp.createdAt) }}</td>
						<td class="crm-actions">
							<button
								v-if="canUpdate && opp.stage !== 'won' && opp.stage !== 'lost'"
								class="crm-btn crm-btn-success"
								@click="setStage(opp, 'won')"
							>
								Ganar
							</button>
							<button
								v-if="canUpdate && opp.stage !== 'won' && opp.stage !== 'lost'"
								class="crm-btn"
								@click="setStage(opp, 'lost')"
							>
								Perder
							</button>
							<button v-if="canUpdate" class="crm-btn crm-btn-primary" @click="openEdit(opp)">
								Editar
							</button>
							<button v-if="canDelete" class="crm-btn crm-btn-danger" @click="remove(opp)">
								Eliminar
							</button>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td colspan="8" class="crm-empty">No se encontraron oportunidades</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="crm-footer">
			<div class="crm-pagination">
				<button :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button>
				<span>Página {{ page }} de {{ lastPage }} · {{ total }} oportunidades</span>
				<button :disabled="page === lastPage" @click="goToPage(page + 1)">Siguiente</button>
			</div>
			<select v-model.number="limit" class="crm-limit" @change="changeLimit()">
				<option :value="10">10 / pág</option>
				<option :value="15">15 / pág</option>
				<option :value="25">25 / pág</option>
				<option :value="50">50 / pág</option>
			</select>
		</div>

		<ResourceFormModal
			v-if="showForm"
			:title="formTitle"
			:fields="formFields"
			:initial="formInitial"
			:saving="formSaving"
			:error="formError"
			@save="save"
			@close="closeForm"
		/>
	</div>
</template>
