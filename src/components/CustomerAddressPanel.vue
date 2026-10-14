<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
	customerAddressService,
	type CustomerAddress,
} from '@/services/customer-addresses.services'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
	/** `id` del cliente en edición. */
	entityId: number | null
}>()

const authStore = useAuthStore()
const canManage = computed(() => authStore.hasPermission('customers:update'))
const canDelete = computed(() => authStore.hasPermission('customers:delete'))

const items = ref<CustomerAddress[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const addressTypes = [
	{ value: 'shipping', label: 'Envío' },
	{ value: 'billing', label: 'Facturación' },
]

function emptyForm() {
	return {
		type: 'shipping',
		line1: '',
		line2: '',
		city: '',
		state: '',
		postalCode: '',
		country: '',
		isDefault: false,
	}
}

const form = reactive(emptyForm())
const editingId = ref<number | null>(null)

async function load() {
	if (!props.entityId) {
		items.value = []
		return
	}
	loading.value = true
	error.value = ''
	try {
		items.value = await customerAddressService.list(props.entityId)
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al cargar direcciones'
		items.value = []
	} finally {
		loading.value = false
	}
}

function resetForm() {
	Object.assign(form, emptyForm())
	editingId.value = null
}

function startEdit(item: CustomerAddress) {
	editingId.value = item.id
	form.type = item.type
	form.line1 = item.line1
	form.line2 = item.line2 ?? ''
	form.city = item.city ?? ''
	form.state = item.state ?? ''
	form.postalCode = item.postalCode ?? ''
	form.country = item.country ?? ''
	form.isDefault = item.isDefault
}

function buildPayload() {
	return {
		type: form.type as 'shipping' | 'billing',
		line1: form.line1.trim(),
		line2: form.line2.trim() || undefined,
		city: form.city.trim() || undefined,
		state: form.state.trim() || undefined,
		postalCode: form.postalCode.trim() || undefined,
		country: form.country.trim() || undefined,
		isDefault: form.isDefault,
	}
}

async function submit() {
	if (!props.entityId || !form.line1.trim()) {
		return
	}
	saving.value = true
	error.value = ''
	try {
		const payload = buildPayload()
		if (editingId.value) {
			await customerAddressService.update(props.entityId, editingId.value, payload)
		} else {
			await customerAddressService.create(props.entityId, payload)
		}
		resetForm()
		await load()
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al guardar la dirección'
	} finally {
		saving.value = false
	}
}

async function removeItem(item: CustomerAddress) {
	if (!props.entityId || !window.confirm('¿Eliminar esta dirección?')) {
		return
	}
	try {
		await customerAddressService.remove(props.entityId, item.id)
		if (editingId.value === item.id) {
			resetForm()
		}
		await load()
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

function typeLabel(type: string): string {
	return addressTypes.find((opt) => opt.value === type)?.label ?? type
}

onMounted(load)
watch(() => props.entityId, load)
</script>

<template>
	<div class="cap">
		<h4 class="cap-title">Direcciones</h4>

		<p v-if="!entityId" class="cap-hint">
			Guardá el cliente para poder agregar direcciones.
		</p>

		<template v-else>
			<form v-if="canManage" class="cap-form" @submit.prevent="submit">
				<select v-model="form.type" class="cap-type">
					<option v-for="opt in addressTypes" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
				<input v-model="form.line1" class="cap-line1" placeholder="Dirección *" />
				<input v-model="form.line2" class="cap-line1" placeholder="Complemento" />
				<input v-model="form.city" placeholder="Ciudad" />
				<input v-model="form.state" placeholder="Provincia" />
				<input v-model="form.postalCode" placeholder="C.P." />
				<input v-model="form.country" placeholder="País" />
				<label class="cap-check">
					<input v-model="form.isDefault" type="checkbox" />
					Predeterminada
				</label>
				<button type="submit" class="cap-btn" :disabled="saving || !form.line1.trim()">
					{{ editingId ? 'Actualizar' : 'Agregar' }}
				</button>
				<button
					v-if="editingId"
					type="button"
					class="cap-btn cap-btn-outline"
					@click="resetForm"
				>
					Cancelar
				</button>
			</form>

			<p v-if="error" class="cap-error">{{ error }}</p>
			<p v-if="loading" class="cap-hint">Cargando direcciones...</p>

			<table v-else-if="items.length" class="cap-table">
				<thead>
					<tr>
						<th>Tipo</th>
						<th>Dirección</th>
						<th>Ciudad</th>
						<th>País</th>
						<th></th>
						<th v-if="canManage || canDelete"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in items" :key="item.id">
						<td>{{ typeLabel(item.type) }}</td>
						<td>
							{{ item.line1 }}
							<span v-if="item.line2"> · {{ item.line2 }}</span>
						</td>
						<td>{{ item.city ?? '—' }}</td>
						<td>{{ item.country ?? '—' }}</td>
						<td>
							<span v-if="item.isDefault" class="cap-badge">Predeterminada</span>
						</td>
						<td v-if="canManage || canDelete" class="cap-cell-actions">
							<button v-if="canManage" type="button" class="cap-link" @click="startEdit(item)">
								Editar
							</button>
							<button
								v-if="canDelete"
								type="button"
								class="cap-link cap-link-danger"
								@click="removeItem(item)"
							>
								Eliminar
							</button>
						</td>
					</tr>
				</tbody>
			</table>
			<p v-else class="cap-hint">Sin direcciones cargadas.</p>
		</template>
	</div>
</template>

<style scoped>
.cap {
	border-top: 1px solid #eee;
	padding-top: 12px;
}

.cap-title {
	margin: 0 0 10px;
	font-size: 0.95rem;
	color: #2c3e50;
}

.cap-hint {
	color: #6c757d;
	font-size: 0.9rem;
	margin: 4px 0;
}

.cap-form {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
	margin-bottom: 10px;
}

.cap-form input,
.cap-form select {
	padding: 7px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.cap-line1 {
	flex: 1 1 200px;
}

.cap-check {
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 0.9rem;
	color: #333;
}

.cap-btn {
	padding: 7px 14px;
	border: none;
	border-radius: 4px;
	background: #1976d2;
	color: #fff;
	cursor: pointer;
	font: inherit;
}

.cap-btn-outline {
	background: #fff;
	border: 1px solid #ced4da;
	color: #333;
}

.cap-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.cap-error {
	color: #dc3545;
	font-size: 0.9rem;
	margin: 4px 0;
}

.cap-table {
	width: 100%;
	border-collapse: collapse;
}

.cap-table th,
.cap-table td {
	padding: 6px 8px;
	border-bottom: 1px solid #eee;
	text-align: left;
	font-size: 0.9rem;
}

.cap-table th {
	color: #6c757d;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.03em;
}

.cap-cell-actions {
	display: flex;
	gap: 8px;
}

.cap-badge {
	background: #e3f2fd;
	color: #1976d2;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 0.8rem;
}

.cap-link {
	border: none;
	background: none;
	color: #1976d2;
	cursor: pointer;
	padding: 0;
	font: inherit;
	font-size: 0.85rem;
}

.cap-link-danger {
	color: #c62828;
}
</style>
