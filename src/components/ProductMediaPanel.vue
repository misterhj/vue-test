<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
	productMediaService,
	type ProductMedia,
} from '@/services/product-media.services'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
	/** `id` del producto en edición. */
	entityId: number | null
}>()

const authStore = useAuthStore()
const canManage = computed(() => authStore.hasPermission('products:media'))

const items = ref<ProductMedia[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const mediaTypes = [
	{ value: 'image', label: 'Imagen' },
	{ value: 'video', label: 'Video' },
	{ value: 'other', label: 'Otro' },
]

const form = reactive({
	url: '',
	mediaType: 'image',
	isPrimary: false,
})
const editingId = ref<number | null>(null)

async function load() {
	if (!props.entityId) {
		items.value = []
		return
	}
	loading.value = true
	error.value = ''
	try {
		items.value = await productMediaService.list(props.entityId)
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al cargar medios'
		items.value = []
	} finally {
		loading.value = false
	}
}

function resetForm() {
	form.url = ''
	form.mediaType = 'image'
	form.isPrimary = false
	editingId.value = null
}

function startEdit(item: ProductMedia) {
	editingId.value = item.id
	form.url = item.url ?? ''
	form.mediaType = item.mediaType
	form.isPrimary = item.isPrimary
}

async function submit() {
	if (!props.entityId || !form.url.trim()) {
		return
	}
	saving.value = true
	error.value = ''
	try {
		const payload = {
			url: form.url.trim(),
			mediaType: form.mediaType,
			isPrimary: form.isPrimary,
		}
		if (editingId.value) {
			await productMediaService.update(props.entityId, editingId.value, payload)
		} else {
			await productMediaService.create(props.entityId, payload)
		}
		resetForm()
		await load()
	} catch (err: unknown) {
		error.value = (err as { message?: string })?.message ?? 'Error al guardar el medio'
	} finally {
		saving.value = false
	}
}

async function setPrimary(item: ProductMedia) {
	if (!props.entityId) {
		return
	}
	try {
		await productMediaService.update(props.entityId, item.id, { isPrimary: true })
		await load()
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al actualizar')
	}
}

async function removeItem(item: ProductMedia) {
	if (!props.entityId || !window.confirm('¿Eliminar este medio?')) {
		return
	}
	try {
		await productMediaService.remove(props.entityId, item.id)
		if (editingId.value === item.id) {
			resetForm()
		}
		await load()
	} catch (err: unknown) {
		window.alert((err as { message?: string })?.message ?? 'Error al eliminar')
	}
}

onMounted(load)
watch(() => props.entityId, load)
</script>

<template>
	<div class="pmp">
		<h4 class="pmp-title">Medios del producto</h4>

		<p v-if="!entityId" class="pmp-hint">
			Guardá el producto para poder agregar medios.
		</p>

		<template v-else>
			<form v-if="canManage" class="pmp-form" @submit.prevent="submit">
				<input
					v-model="form.url"
					type="text"
					class="pmp-url"
					placeholder="https://cdn.example.com/producto.jpg"
				/>
				<select v-model="form.mediaType">
					<option v-for="opt in mediaTypes" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
				<label class="pmp-check">
					<input v-model="form.isPrimary" type="checkbox" />
					Principal
				</label>
				<button type="submit" class="pmp-btn" :disabled="saving || !form.url.trim()">
					{{ editingId ? 'Actualizar' : 'Agregar' }}
				</button>
				<button
					v-if="editingId"
					type="button"
					class="pmp-btn pmp-btn-outline"
					@click="resetForm"
				>
					Cancelar
				</button>
			</form>

			<p v-if="error" class="pmp-error">{{ error }}</p>
			<p v-if="loading" class="pmp-hint">Cargando medios...</p>

			<table v-else-if="items.length" class="pmp-table">
				<thead>
					<tr>
						<th>URL</th>
						<th>Tipo</th>
						<th>Principal</th>
						<th v-if="canManage"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in items" :key="item.id">
						<td class="pmp-cell-url">{{ item.url ?? '—' }}</td>
						<td>{{ item.mediaType }}</td>
						<td>
							<span v-if="item.isPrimary" class="pmp-badge">Sí</span>
							<span v-else>—</span>
						</td>
						<td v-if="canManage" class="pmp-cell-actions">
							<button type="button" class="pmp-link" @click="startEdit(item)">
								Editar
							</button>
							<button
								v-if="!item.isPrimary"
								type="button"
								class="pmp-link"
								@click="setPrimary(item)"
							>
								Principal
							</button>
							<button
								type="button"
								class="pmp-link pmp-link-danger"
								@click="removeItem(item)"
							>
								Eliminar
							</button>
						</td>
					</tr>
				</tbody>
			</table>
			<p v-else class="pmp-hint">Sin medios cargados.</p>
		</template>
	</div>
</template>

<style scoped>
.pmp {
	border-top: 1px solid #eee;
	padding-top: 12px;
}

.pmp-title {
	margin: 0 0 10px;
	font-size: 0.95rem;
	color: #2c3e50;
}

.pmp-hint {
	color: #6c757d;
	font-size: 0.9rem;
	margin: 4px 0;
}

.pmp-form {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
	margin-bottom: 10px;
}

.pmp-url {
	flex: 1 1 240px;
	padding: 7px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.pmp-form select {
	padding: 7px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.pmp-check {
	display: flex;
	align-items: center;
	gap: 5px;
	font-size: 0.9rem;
	color: #333;
}

.pmp-btn {
	padding: 7px 14px;
	border: none;
	border-radius: 4px;
	background: #1976d2;
	color: #fff;
	cursor: pointer;
	font: inherit;
}

.pmp-btn-outline {
	background: #fff;
	border: 1px solid #ced4da;
	color: #333;
}

.pmp-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.pmp-error {
	color: #dc3545;
	font-size: 0.9rem;
	margin: 4px 0;
}

.pmp-table {
	width: 100%;
	border-collapse: collapse;
}

.pmp-table th,
.pmp-table td {
	padding: 6px 8px;
	border-bottom: 1px solid #eee;
	text-align: left;
	font-size: 0.9rem;
}

.pmp-table th {
	color: #6c757d;
	font-size: 0.8rem;
	text-transform: uppercase;
	letter-spacing: 0.03em;
}

.pmp-cell-url {
	max-width: 320px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.pmp-cell-actions {
	display: flex;
	gap: 8px;
}

.pmp-badge {
	background: #d4edda;
	color: #155724;
	padding: 2px 8px;
	border-radius: 999px;
	font-size: 0.8rem;
}

.pmp-link {
	border: none;
	background: none;
	color: #1976d2;
	cursor: pointer;
	padding: 0;
	font: inherit;
	font-size: 0.85rem;
}

.pmp-link-danger {
	color: #c62828;
}
</style>
