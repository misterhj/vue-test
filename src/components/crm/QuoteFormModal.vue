<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getOptions } from '@/services/list.services'
import type { OptionItem } from '@/services/list.services'
import type { QuoteFormInitial, QuoteInput, QuoteItemInput } from '@/services/crm.services'
import '@/components/crm/crm.css'

const props = defineProps<{
	title: string
	initial?: QuoteFormInitial
	saving?: boolean
	error?: string
}>()

const emit = defineEmits<{
	(e: 'save', payload: QuoteInput): void
	(e: 'close'): void
}>()

function today(): string {
	return new Date().toISOString().slice(0, 10)
}

const customerId = ref<number | ''>(props.initial?.customerId ?? '')
const opportunityId = ref<number | ''>(props.initial?.opportunityId ?? '')
const date = ref<string>(props.initial?.date ?? today())
const validUntil = ref<string>(props.initial?.validUntil ?? '')
const notes = ref<string>(props.initial?.notes ?? '')
const items = reactive<QuoteItemInput[]>(
	props.initial?.items?.length
		? props.initial.items.map((item) => ({ ...item }))
		: [{ productId: 0, description: '', quantity: 1, unitPrice: 0, discount: 0 }],
)

const customerOptions = ref<OptionItem[]>([])
const opportunityOptions = ref<OptionItem[]>([])
const productOptions = ref<OptionItem[]>([])

async function loadOptions() {
	try {
		customerOptions.value = await getOptions('customers')
	} catch {
		customerOptions.value = []
	}
	try {
		opportunityOptions.value = await getOptions('crm-opportunities', 'title')
	} catch {
		opportunityOptions.value = []
	}
	try {
		productOptions.value = await getOptions('products')
	} catch {
		productOptions.value = []
	}
}

function addLine() {
	items.push({ productId: 0, description: '', quantity: 1, unitPrice: 0, discount: 0 })
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

function lineTotal(item: QuoteItemInput): number {
	return round2((item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0))
}

const subtotal = computed(() =>
	round2(items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)),
)
const discountTotal = computed(() =>
	round2(items.reduce((sum, item) => sum + (item.discount || 0), 0)),
)
const total = computed(() => round2(subtotal.value - discountTotal.value))

const isValid = computed(() => {
	if (customerId.value === '' || customerId.value === null) {
		return false
	}
	if (!date.value) {
		return false
	}
	if (!items.length) {
		return false
	}
	return items.every(
		(item) =>
			Number(item.productId) > 0 &&
			Number(item.quantity) >= 1 &&
			Number(item.unitPrice) >= 0,
	)
})

function onSubmit() {
	if (!isValid.value) {
		return
	}
	emit('save', {
		customerId: Number(customerId.value),
		opportunityId:
			opportunityId.value === '' || opportunityId.value === null
				? undefined
				: Number(opportunityId.value),
		date: date.value,
		validUntil: validUntil.value || undefined,
		notes: notes.value.trim() || undefined,
		items: items.map((item) => ({
			productId: Number(item.productId),
			description: item.description?.trim() || undefined,
			quantity: Number(item.quantity),
			unitPrice: Number(item.unitPrice),
			discount: Number(item.discount || 0),
		})),
	})
}

onMounted(loadOptions)
</script>

<template>
	<div class="crm-modal-overlay" @click.self="emit('close')">
		<div class="crm-modal crm-modal--wide">
			<h3 class="crm-modal-title">{{ title }}</h3>

			<form @submit.prevent="onSubmit">
				<div class="crm-field-row">
					<div class="crm-field">
						<label>Cliente</label>
						<select v-model.number="customerId" required>
							<option value="" disabled>— Seleccionar —</option>
							<option
								v-for="opt in customerOptions"
								:key="String(opt.value)"
								:value="opt.value"
							>
								{{ opt.label }}
							</option>
						</select>
					</div>
					<div class="crm-field">
						<label>Oportunidad (opcional)</label>
						<select v-model.number="opportunityId">
							<option value="">— Ninguna —</option>
							<option
								v-for="opt in opportunityOptions"
								:key="String(opt.value)"
								:value="opt.value"
							>
								{{ opt.label }}
							</option>
						</select>
					</div>
				</div>

				<div class="crm-field-row">
					<div class="crm-field">
						<label>Fecha</label>
						<input v-model="date" type="date" required />
					</div>
					<div class="crm-field">
						<label>Válida hasta (opcional)</label>
						<input v-model="validUntil" type="date" />
					</div>
				</div>

				<div class="crm-subpanel">
					<table class="crm-table">
						<thead>
							<tr>
								<th>Producto</th>
								<th>Descripción</th>
								<th class="crm-num">Cantidad</th>
								<th class="crm-num">Precio unit.</th>
								<th class="crm-num">Descuento</th>
								<th class="crm-num">Total línea</th>
								<th class="crm-actions-head"></th>
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
								<td>
									<input v-model="item.description" type="text" placeholder="Opcional" />
								</td>
								<td class="crm-num">
									<input v-model.number="item.quantity" type="number" min="1" step="1" />
								</td>
								<td class="crm-num">
									<input v-model.number="item.unitPrice" type="number" min="0" step="0.01" />
								</td>
								<td class="crm-num">
									<input v-model.number="item.discount" type="number" min="0" step="0.01" />
								</td>
								<td class="crm-num">{{ money(lineTotal(item)) }}</td>
								<td class="crm-actions">
									<button
										type="button"
										class="crm-btn crm-btn-danger"
										title="Quitar línea"
										@click="removeLine(index)"
									>
										×
									</button>
								</td>
							</tr>
						</tbody>
					</table>

					<button type="button" class="crm-add-line" @click="addLine">+ Agregar línea</button>
				</div>

				<div class="crm-field">
					<label>Notas</label>
					<textarea v-model="notes" rows="2"></textarea>
				</div>

				<div class="crm-totals">
					<span>Subtotal: <b>{{ money(subtotal) }}</b></span>
					<span>Descuento: <b>{{ money(discountTotal) }}</b></span>
					<span>Total: <b>{{ money(total) }}</b></span>
				</div>

				<p v-if="error" class="crm-modal-error">{{ error }}</p>

				<div class="crm-modal-actions">
					<button type="button" class="crm-btn crm-btn-lg" @click="emit('close')">
						Cancelar
					</button>
					<button
						type="submit"
						class="crm-btn crm-btn-primary crm-btn-lg"
						:disabled="!isValid || saving"
					>
						{{ saving ? 'Guardando...' : 'Guardar' }}
					</button>
				</div>
			</form>
		</div>
	</div>
</template>
