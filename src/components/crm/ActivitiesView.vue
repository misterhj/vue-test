<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
	ACTIVITY_ENTITY_TYPES,
	ACTIVITY_TYPES,
	crmService,
	optionLabel,
	type Activity,
	type ActivityEntityType,
	type ActivityInput,
	type ActivityType,
} from '@/services/crm.services'
import { useCrmList } from '@/composables/useCrmList'
import { clearOptionsCache } from '@/services/list.services'
import { useAuthStore } from '@/stores/auth'
import ResourceFormModal from '@/components/ResourceFormModal.vue'
import type { ResourceFormField } from '@/config/resource-list.types'
import '@/components/crm/crm.css'

const authStore = useAuthStore()

const search = ref('')
const typeFilter = ref('')
const completedFilter = ref('')

const { rows, loading, error, page, lastPage, total, limit, apply, goToPage, changeLimit } =
	useCrmList<Activity>((params) => crmService.listActivities(params))

function filters(): Record<string, unknown> {
	let completed: boolean | undefined
	if (completedFilter.value === 'true') {
		completed = true
	} else if (completedFilter.value === 'false') {
		completed = false
	}
	return {
		search: search.value.trim() || undefined,
		type: typeFilter.value || undefined,
		completed,
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

function formatDate(value: string | null): string {
	if (!value) {
		return '—'
	}
	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-AR')
}

function assignedName(activity: Activity): string {
	const user = activity.assignedTo
	if (!user) {
		return '—'
	}
	const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
	return full || user.username || '—'
}

function isCompleted(activity: Activity): boolean {
	return Boolean(activity.completedAt)
}

const formFields: ResourceFormField[] = [
	{ key: 'subject', label: 'Asunto', type: 'text', required: true, maxLength: 150 },
	{
		key: 'type',
		label: 'Tipo',
		type: 'select',
		defaultValue: 'task',
		options: ACTIVITY_TYPES,
	},
	{
		key: 'entityType',
		label: 'Entidad',
		type: 'select',
		required: true,
		defaultValue: 'lead',
		options: ACTIVITY_ENTITY_TYPES,
	},
	{ key: 'entityId', label: 'ID de la entidad', type: 'number', required: true, min: 1 },
	{ key: 'dueAt', label: 'Vence', type: 'date' },
	{
		key: 'assignedToId',
		label: 'Responsable',
		type: 'select',
		optionsResource: 'users',
	},
	{ key: 'notes', label: 'Notas', type: 'textarea', fullWidth: true },
]

const showForm = ref(false)
const editing = ref<Activity | null>(null)
const formSaving = ref(false)
const formError = ref('')

const formTitle = computed(() => (editing.value ? 'Editar actividad' : 'Nueva actividad'))

const formInitial = computed<Record<string, unknown> | undefined>(() => {
	const activity = editing.value
	if (!activity) {
		return undefined
	}
	return {
		subject: activity.subject,
		type: activity.type,
		entityType: activity.entityType,
		entityId: activity.entityId,
		dueAt: activity.dueAt ?? '',
		assignedToId: activity.assignedToId ?? '',
		notes: activity.notes ?? '',
	}
})

function toPayload(payload: Record<string, unknown>): ActivityInput {
	return {
		subject: String(payload.subject ?? ''),
		type: (payload.type as ActivityType) || 'task',
		entityType: (payload.entityType as ActivityEntityType) || 'lead',
		entityId: Number(payload.entityId ?? 0),
		dueAt: (payload.dueAt as string) || undefined,
		assignedToId: num(payload.assignedToId),
		notes: (payload.notes as string) || undefined,
	}
}

function openCreate() {
	editing.value = null
	formError.value = ''
	showForm.value = true
}

function openEdit(activity: Activity) {
	editing.value = activity
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
			await crmService.updateActivity(editing.value.id, data)
		} else {
			await crmService.createActivity(data)
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

async function complete(activity: Activity) {
	try {
		await crmService.completeActivity(activity.id)
		clearOptionsCache()
		await apply(filters())
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al completar')
	}
}

async function remove(activity: Activity) {
	if (!window.confirm(`¿Eliminar la actividad "${activity.subject}"?`)) {
		return
	}
	try {
		await crmService.removeActivity(activity.id)
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
				<h1>Actividades</h1>
				<p class="crm-hint">Llamadas, reuniones, tareas y notas sobre leads, oportunidades y clientes.</p>
			</div>
			<button v-if="canCreate" class="crm-btn crm-btn-primary crm-btn-lg" @click="openCreate()">
				+ Nueva actividad
			</button>
		</div>

		<div class="crm-toolbar">
			<input v-model="search" type="text" class="crm-search" placeholder="Buscar por asunto..." />
			<label class="crm-filter">
				<span>Tipo</span>
				<select v-model="typeFilter" @change="apply(filters())">
					<option value="">Todos</option>
					<option v-for="opt in ACTIVITY_TYPES" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</label>
			<label class="crm-filter">
				<span>Estado</span>
				<select v-model="completedFilter" @change="apply(filters())">
					<option value="">Todas</option>
					<option value="false">Pendientes</option>
					<option value="true">Completadas</option>
				</select>
			</label>
		</div>

		<div v-if="loading" class="crm-message">Cargando actividades...</div>
		<div v-else-if="error" class="crm-message crm-error">{{ error }}</div>

		<div v-else class="crm-table-wrap">
			<table class="crm-table">
				<thead>
					<tr>
						<th>Tipo</th>
						<th>Asunto</th>
						<th>Entidad</th>
						<th>Vence</th>
						<th>Estado</th>
						<th>Responsable</th>
						<th class="crm-actions-head">Acciones</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="activity in rows" :key="activity.id">
						<td>{{ optionLabel(ACTIVITY_TYPES, activity.type) }}</td>
						<td>{{ activity.subject }}</td>
						<td>
							{{ optionLabel(ACTIVITY_ENTITY_TYPES, activity.entityType) }} #{{ activity.entityId }}
						</td>
						<td>{{ formatDate(activity.dueAt) }}</td>
						<td>
							<span
								class="crm-badge"
								:class="isCompleted(activity) ? 'crm-badge--green' : 'crm-badge--amber'"
							>
								{{ isCompleted(activity) ? 'Completada' : 'Pendiente' }}
							</span>
						</td>
						<td>{{ assignedName(activity) }}</td>
						<td class="crm-actions">
							<button
								v-if="canUpdate && !isCompleted(activity)"
								class="crm-btn crm-btn-success"
								@click="complete(activity)"
							>
								Completar
							</button>
							<button v-if="canUpdate" class="crm-btn crm-btn-primary" @click="openEdit(activity)">
								Editar
							</button>
							<button v-if="canDelete" class="crm-btn crm-btn-danger" @click="remove(activity)">
								Eliminar
							</button>
						</td>
					</tr>
					<tr v-if="rows.length === 0">
						<td colspan="7" class="crm-empty">No se encontraron actividades</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="crm-footer">
			<div class="crm-pagination">
				<button :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button>
				<span>Página {{ page }} de {{ lastPage }} · {{ total }} actividades</span>
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
