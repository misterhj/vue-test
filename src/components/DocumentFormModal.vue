<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getOptions } from '@/services/list.services'
import type { OptionItem } from '@/services/list.services'
import type {
	DocumentFormInitial,
	DocumentFormPayload,
	DocumentLineInput,
} from '@/services/documents.types'

const props = defineProps<{
	title: string
	partyLabel: string
	partyOptions: OptionItem[]
	unitLabel: string
	initial?: DocumentFormInitial
	saving?: boolean
	error?: string
}>()

const emit = defineEmits<{
	(e: 'save', payload: DocumentFormPayload): void
	(e: 'close'): void
}>()

function today(): string {
	return new Date().toISOString().slice(0, 10)
}

const partyId = ref<number | ''>(props.initial?.partyId ?? '')
const date = ref<string>(props.initial?.date ?? today())
const notes = ref<string>(props.initial?.notes ?? '')
const items = reactive<DocumentLineInput[]>(
	props.initial?.items?.length
		? props.initial.items.map((item) => ({ ...item }))
		: [{ productId: 0, quantity: 1, unit: 0, discount: 0 }],
)

const productOptions = ref<OptionItem[]>([])

async function loadProducts() {
	try {
		productOptions.value = await getOptions('products')
	} catch {
		productOptions.value = []
	}
}

function addLine() {
	items.push({ productId: 0, quantity: 1, unit: 0, discount: 0 })
}

function removeLine(index: number) {
	items.splice(index, 1)
	if (!items.length) {
		addLine()
	}
}

function round2(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100
}

function money(value: number): string {
	return `$${value.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function lineTotal(item: DocumentLineInput): number {
	return round2((item.quantity || 0) * (item.unit || 0) - (item.discount || 0))
}

const subtotal = computed(() =>
	round2(items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit || 0), 0)),
)
const discountTotal = computed(() =>
	round2(items.reduce((sum, item) => sum + (item.discount || 0), 0)),
)
const total = computed(() => round2(subtotal.value - discountTotal.value))

const isValid = computed(() => {
	if (partyId.value === '' || partyId.value === null) {
		return false
	}
	if (!date.value) {
		return false
	}
	if (!items.length) {
		return false
	}
	return items.every(
		(item) => Number(item.productId) > 0 && Number(item.quantity) >= 1 && Number(item.unit) >= 0,
	)
})

function onSubmit() {
	if (!isValid.value) {
		return
	}
	emit('save', {
		partyId: Number(partyId.value),
		date: date.value,
		notes: notes.value.trim(),
		items: items.map((item) => ({
			productId: Number(item.productId),
			quantity: Number(item.quantity),
			unit: Number(item.unit),
			discount: Number(item.discount || 0),
		})),
	})
}

onMounted(loadProducts)
</script>

<template>
	<div class="dfm-overlay" @click.self="emit('close')">
		<div class="dfm-card">
			<h3 class="dfm-title">{{ title }}</h3>

			<form class="dfm-form" @submit.prevent="onSubmit">
				<div class="dfm-header-fields">
					<div class="dfm-field">
						<label class="dfm-label">{{ partyLabel }} <span class="dfm-required">*</span></label>
						<select v-model.number="partyId" required>
							<option value="" disabled>— Seleccionar —</option>
							<option
								v-for="opt in partyOptions"
								:key="String(opt.value)"
								:value="opt.value"
							>
								{{ opt.label }}
							</option>
						</select>
					</div>

					<div class="dfm-field">
						<label class="dfm-label">Fecha <span class="dfm-required">*</span></label>
						<input v-model="date" type="date" required />
					</div>
				</div>

				<div class="dfm-field dfm-full">
					<label class="dfm-label">Notas</label>
					<textarea v-model="notes" rows="2" placeholder="Observaciones (opcional)" />
				</div>

				<div class="dfm-lines">
					<table class="dfm-lines-table">
						<thead>
							<tr>
								<th>Producto</th>
								<th class="dfm-col-num">Cantidad</th>
								<th class="dfm-col-num">{{ unitLabel }}</th>
								<th class="dfm-col-num">Descuento</th>
								<th class="dfm-col-num">Subtotal</th>
								<th class="dfm-col-x"></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(item, index) in items" :key="index">
								<td>
									<select v-model.number="item.productId" required>
										<option :value="0" disabled>— Seleccionar —</option>
										<option
											v-for="opt in productOptions"
											:key="String(opt.value)"
											:value="opt.value"
										>
											{{ opt.label }}
										</option>
									</select>
								</td>
								<td class="dfm-col-num">
									<input v-model.number="item.quantity" type="number" min="1" step="1" />
								</td>
								<td class="dfm-col-num">
									<input v-model.number="item.unit" type="number" min="0" step="0.01" />
								</td>
								<td class="dfm-col-num">
									<input v-model.number="item.discount" type="number" min="0" step="0.01" />
								</td>
								<td class="dfm-col-num dfm-line-total">{{ money(lineTotal(item)) }}</td>
								<td class="dfm-col-x">
									<button
										type="button"
										class="dfm-remove"
										title="Quitar línea"
										aria-label="Quitar línea"
										@click="removeLine(index)"
									>
										×
									</button>
								</td>
							</tr>
						</tbody>
					</table>

					<button type="button" class="dfm-add-line" @click="addLine">
						+ Agregar línea
					</button>
				</div>

				<div class="dfm-totals">
					<span>Subtotal: <b>{{ money(subtotal) }}</b></span>
					<span>Descuento: <b>{{ money(discountTotal) }}</b></span>
					<span class="dfm-total">Total: <b>{{ money(total) }}</b></span>
				</div>

				<p v-if="error" class="dfm-error">{{ error }}</p>

				<div class="dfm-actions">
					<button type="button" class="dfm-btn dfm-btn-outline" @click="emit('close')">
						Cancelar
					</button>
					<button
						type="submit"
						class="dfm-btn dfm-btn-primary"
						:disabled="!isValid || saving"
					>
						{{ saving ? 'Guardando...' : 'Guardar' }}
					</button>
				</div>
			</form>
		</div>
	</div>
</template>

<style scoped>
.dfm-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.dfm-card {
	background: #fff;
	padding: 24px;
	border-radius: 8px;
	width: 860px;
	max-width: 96vw;
	max-height: 90vh;
	overflow-y: auto;
}

.dfm-title {
	margin: 0 0 18px;
	color: #2c3e50;
}

.dfm-form {
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
}

.dfm-header-fields {
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
	flex-basis: 100%;
}

.dfm-field {
	flex: 1 1 calc(50% - 7px);
	min-width: 200px;
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.dfm-full {
	flex-basis: 100%;
}

.dfm-label {
	font-size: 0.85rem;
	color: #495057;
}

.dfm-required {
	color: #dc3545;
}

.dfm-field input,
.dfm-field select,
.dfm-field textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 8px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.dfm-lines {
	flex-basis: 100%;
	overflow-x: auto;
}

.dfm-lines-table {
	width: 100%;
	border-collapse: collapse;
}

.dfm-lines-table th,
.dfm-lines-table td {
	padding: 6px 8px;
	border-bottom: 1px solid #eee;
	text-align: left;
}

.dfm-lines-table th {
	font-size: 0.8rem;
	color: #6c757d;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	white-space: nowrap;
}

.dfm-lines-table select,
.dfm-lines-table input {
	width: 100%;
	box-sizing: border-box;
	padding: 6px 8px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.dfm-col-num {
	width: 120px;
	text-align: right;
}

.dfm-col-num input {
	text-align: right;
}

.dfm-col-x {
	width: 40px;
	text-align: center;
}

.dfm-line-total {
	text-align: right;
	white-space: nowrap;
}

.dfm-remove {
	border: none;
	background: #fde8e8;
	color: #c62828;
	width: 28px;
	height: 28px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 1rem;
	line-height: 1;
}

.dfm-add-line {
	margin-top: 8px;
	padding: 6px 12px;
	border: 1px dashed #1976d2;
	border-radius: 4px;
	background: #f1f7fd;
	color: #1976d2;
	cursor: pointer;
	font: inherit;
}

.dfm-totals {
	flex-basis: 100%;
	display: flex;
	justify-content: flex-end;
	gap: 24px;
	padding: 12px 4px 0;
	border-top: 1px solid #eee;
	color: #495057;
}

.dfm-total {
	font-size: 1.1rem;
	color: #2c3e50;
}

.dfm-error {
	flex-basis: 100%;
	margin: 0;
	color: #dc3545;
	font-size: 0.9rem;
}

.dfm-actions {
	flex-basis: 100%;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 4px;
}

.dfm-btn {
	padding: 8px 16px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	font: inherit;
}

.dfm-btn-outline {
	background: #fff;
	border: 1px solid #ced4da;
	color: #333;
}

.dfm-btn-primary {
	background: #1976d2;
	color: #fff;
}

.dfm-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
</style>
