<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
	LEAD_SOURCES,
	LEAD_STATUSES,
	crmService,
	optionLabel,
	type Lead,
	type LeadInput,
	type LeadSource,
	type LeadStatus,
} from '@/services/crm.services'
import { useCrmList } from '@/composables/useCrmList'
import { clearOptionsCache } from '@/services/list.services'
import { useAuthStore } from '@/stores/auth'
import ResourceFormModal from '@/components/ResourceFormModal.vue'
import type { ResourceFormField } from '@/config/resource-list.types'
import '@/components/crm/crm.css'

const authStore = useAuthStore()

const search = ref('')
const statusFilter = ref('')
const sourceFilter = ref('')

const { rows, loading, error, page, lastPage, total, limit, apply, goToPage, changeLimit } =
	useCrmList<Lead>((params) => crmService.listLeads(params))

function filters(): Record<string, unknown> {
	return {
		search: search.value.trim() || undefined,
		status: statusFilter.value || undefined,
		source: sourceFilter.value || undefined,
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

function assignedName(lead: Lead): string {
	const user = lead.assignedTo
	if (!user) {
		return '—'
	}
	const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
	return full || user.username || `#${user.id}`
}

function statusClass(status: LeadStatus): string {
	const map: Record<LeadStatus, string> = {
		new: 'crm-badge--blue',
		contacted: 'crm-badge--amber',
		qualified: 'crm-badge--blue',
		converted: 'crm-badge--green',
		lost: 'crm-badge--red',
	}
	return map[status] ?? 'crm-badge--gray'
}

function isOpen(lead: Lead): boolean {
	return lead.status !== 'converted' && lead.status !== 'lost'
}

function sourceLabel(source: LeadSource): string {
	return optionLabel(LEAD_SOURCES, source)
}

function formatDate(value: string | null): string {
	if (!value) {
		return '—'
	}
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-AR')
}

const formFields: ResourceFormField[] = [
	{ key: 'firstName', label: 'Nombre', type: 'text', required: true, maxLength: 100 },
	{ key: 'lastName', label: 'Apellido', type: 'text', maxLength: 100 },
	{ key: 'businessName', label: 'Empresa', type: 'text', maxLength: 150 },
	{ key: 'email', label: 'Email', type: 'text', maxLength: 150 },
	{ key: 'phone', label: 'Teléfono', type: 'text', maxLength: 30 },
	{ key: 'source', label: 'Origen', type: 'select', defaultValue: 'web', options: LEAD_SOURCES },
	{ key: 'status', label: 'Estado', type: 'select', defaultValue: 'new', options: LEAD_STATUSES },
	{
		key: 'assignedToId',
		label: 'Responsable',
		type: 'select',
		optionsResource: 'users',
		optionLabel: 'username',
	},
	{ key: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
]

const showForm = ref(false)
const editing = ref<Lead | null>(null)
const formSaving = ref(false)
const formError = ref('')

const formTitle = computed(() => (editing.value ? 'Editar lead' : 'Nuevo lead'))

const formInitial = computed<Record<string, unknown> | undefined>(() => {
	const lead = editing.value
	if (!lead) {
		return undefined
	}
	return {
		firstName: lead.firstName,
		lastName: lead.lastName ?? '',
		businessName: lead.businessName ?? '',
		email: lead.email ?? '',
		phone: lead.phone ?? '',
		source: lead.source,
		status: lead.status,
		assignedToId: lead.assignedToId ?? '',
		notes: lead.notes ?? '',
	}
})

function toLeadPayload(payload: Record<string, unknown>): LeadInput {
	const assignedToId =
		payload.assignedToId !== undefined && payload.assignedToId !== ''
			? Number(payload.assignedToId)
			: undefined
	return {
		firstName: String(payload.firstName ?? ''),
		lastName: (payload.lastName as string) || undefined,
		businessName: (payload.businessName as string) || undefined,
		email: (payload.email as string) || undefined,
		phone: (payload.phone as string) || undefined,
		source: (payload.source as LeadSource) || undefined,
		status: (payload.status as LeadStatus) || undefined,
		notes: (payload.notes as string) || undefined,
		assignedToId,
	}
}

function openCreate() {
	editing.value = null
	formError.value = ''
	showForm.value = true
}

function openEdit(lead: Lead) {
	editing.value = lead
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
		const data = toLeadPayload(payload)
		if (editing.value) {
			await crmService.updateLead(editing.value.id, data)
		} else {
			await crmService.createLead(data)
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

async function remove(lead: Lead) {
	if (!window.confirm(`¿Eliminar el lead "${lead.firstName} ${lead.lastName ?? ''}"?`)) {
		return
	}
	try {
		await crmService.removeLead(lead.id)
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

const convertFields: ResourceFormField[] = [
	{ key: 'createCustomer', label: 'Crear / asociar cliente', type: 'boolean', defaultValue: true },
	{ key: 'createOpportunity', label: 'Crear oportunidad', type: 'boolean', defaultValue: true },
	{ key: 'opportunityTitle', label: 'Título de la oportunidad', type: 'text', maxLength: 150 },
	{ key: 'opportunityAmount', label: 'Monto estimado', type: 'number', min: 0, step: 0.01 },
]

const showConvert = ref(false)
const converting = ref<Lead | null>(null)
const convertSaving = ref(false)
const convertError = ref('')

function openConvert(lead: Lead) {
	converting.value = lead
	convertError.value = ''
	showConvert.value = true
}

function closeConvert() {
	showConvert.value = false
	converting.value = null
	convertError.value = ''
}

async function doConvert(payload: Record<string, unknown>) {
	const lead = converting.value
	if (!lead) {
		return
	}
	convertSaving.value = true
	convertError.value = ''
	try {
		await crmService.convertLead(lead.id, {
			createCustomer: Boolean(payload.createCustomer),
			createOpportunity: Boolean(payload.createOpportunity),
			opportunityTitle: (payload.opportunityTitle as string) || undefined,
			opportunityAmount:
				payload.opportunityAmount !== undefined && payload.opportunityAmount !== ''
					? Number(payload.opportunityAmount)
					: undefined,
		})
		closeConvert()
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		convertError.value =
			(err as { message?: string })?.message ?? 'Error al convertir el lead'
	} finally {
		convertSaving.value = false
	}
}

onMounted(() => apply(filters()))
</script>

<template>
	<div class="crm-page">
		<div class="crm-header">
			<div>
				<h1>Leads</h1>
				<p class="crm-hint">Prospectos antes de convertirse en clientes u oportunidades.</p>
			</div>
			<button v-if="canCreate" class="crm-btn crm-btn-primary crm-btn-lg" @click="openCreate()">
				+ Nuevo lead
			</button>
		</div>

		<div class="crm-toolbar">
			<input
				v-model="search"
				type="text"
				class="crm-search"
				placeholder="Buscar por nombre, empresa, email o teléfono..."
			/>
			<label class="crm-filter">
				<span>Estado</span>
				<select v-model="statusFilter" @change="apply(filters())">
					<option value="">Todos</option>
					<option v-for="opt in LEAD_STATUSES" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
			<label class="crm-filter">
				<span>Origen</span>
				<select v-model="sourceFilter" @change="apply(filters())">
					<option value="">Todos</option>
					<option v-for="opt in LEAD_SOURCES" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
		</div>

		<div v-if="loading" class="crm-message">Cargando leads...</div>
		<div v-else-if="error" class="crm-message crm-error">{{ error }}</div>

		<div v-else class="crm-table-wrap">
			<table class="crm-table">
				<thead>
					<tr>
						<th>Nombre</th>
						<th>Empresa</th>
						<th>Email</th>
						<th>Teléfono</th>
						<th>Origen</th>
						<th>Estado</th>
						<th>Responsable</th>
						<th>Creado</th>
						<th class="crm-actions-head">Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="lead in rows" :key="lead.id">
						<td>{{ `${lead.firstName} ${lead.lastName ?? ''}`.trim() }}</td>
						<td>{{ lead.businessName ?? '—' }}</td>
						<td>{{ lead.email ?? '—' }}</td>
						<td>{{ lead.phone ?? '—' }}</td>
						<td>{{ sourceLabel(lead.source) }}</td>
						<td>
							<span class="crm-badge" :class="statusClass(lead.status)">
								{{ optionLabel(LEAD_STATUSES, lead.status) }}
							</span>
						</td>
						<td>{{ assignedName(lead) }}</td>
						<td>{{ formatDate(lead.createdAt) }}</td>
						<td class="crm-actions">
							<button
								v-if="canUpdate && isOpen(lead)"
								class="crm-btn crm-btn-primary"
								@click="openConvert(lead)"
							>
								Convertir
							</button>
							<button
								v-if="canUpdate && lead.status !== 'converted'"
								class="crm-btn"
								@click="openEdit(lead)"
							>
								Editar
							</button>
							<button
								v-if="canDelete"
								class="crm-btn crm-btn-danger"
								@click="remove(lead)"
							>
								Eliminar
							</button>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td colspan="9" class="crm-empty">No se encontraron leads</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="crm-footer">
			<div class="crm-pagination">
				<button :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button>
				<span>Página {{ page }} de {{ lastPage }} · {{ total }} leads</span>
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

		<ResourceFormModal
			v-if="showConvert"
			:title="`Convertir lead: ${converting?.firstName ?? ''}`"
			:fields="convertFields"
			:saving="convertSaving"
			:error="convertError"
			@save="doConvert"
			@close="closeConvert"
		/>
	</div>
</template>
