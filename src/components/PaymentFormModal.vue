<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
	PAYMENT_METHODS,
	paymentService,
	type PaymentInput,
	type PaymentMethod,
	type PaymentSummary,
} from '@/services/payments.services'

const props = defineProps<{
	mode: 'sale' | 'purchase'
	documentId: number
	documentLabel: string
	partyLabel: string
	partyName: string
	saving?: boolean
	error?: string
}>()

const emit = defineEmits<{
	(e: 'save', payload: PaymentInput): void
	(e: 'close'): void
}>()

const isCollection = computed(() => props.mode === 'sale')
const verb = computed(() => (isCollection.value ? 'Cobro' : 'Pago'))
const title = computed(() => `Registrar ${verb.value.toLowerCase()}`)

function today(): string {
	return new Date().toISOString().slice(0, 10)
}

function money(value: number): string {
	return `$${Number(value).toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

const summary = ref<PaymentSummary | null>(null)
const loadingSummary = ref(false)
const summaryError = ref('')

const amount = ref<number>(0)
const method = ref<PaymentMethod>('cash')
const date = ref<string>(today())
const reference = ref<string>('')
const notes = ref<string>('')

const balanceDue = computed(() => summary.value?.balanceDue ?? 0)

const isValid = computed(() => {
	if (loadingSummary.value || summaryError.value) {
		return false
	}
	const value = Number(amount.value)
	return value > 0 && value <= balanceDue.value + 1e-9 && !!date.value
})

async function loadSummary() {
	loadingSummary.value = true
	summaryError.value = ''
	try {
		summary.value = await paymentService.summary(
			isCollection.value ? { saleId: props.documentId } : { purchaseId: props.documentId },
		)
		amount.value = summary.value.balanceDue
	} catch (err: unknown) {
		summaryError.value = (err as { message?: string })?.message ?? 'No se pudo obtener el saldo'
	} finally {
		loadingSummary.value = false
	}
}

function onSubmit() {
	if (!isValid.value) {
		return
	}
	emit('save', {
		...(isCollection.value
			? { saleId: props.documentId }
			: { purchaseId: props.documentId }),
		amount: Number(amount.value),
		method: method.value,
		date: date.value,
		reference: reference.value.trim() || undefined,
		notes: notes.value.trim() || undefined,
	})
}

onMounted(loadSummary)
</script>

<template>
	<div class="pfm-overlay" @click.self="emit('close')">
		<div class="pfm-card">
			<h3 class="pfm-title">{{ title }}</h3>
			<p class="pfm-subtitle">
				{{ documentLabel }} · {{ partyLabel }}: <b>{{ partyName }}</b>
			</p>

			<div v-if="loadingSummary" class="pfm-message">Consultando saldo...</div>
			<div v-else-if="summaryError" class="pfm-message pfm-error">{{ summaryError }}</div>

			<template v-else-if="summary">
				<div class="pfm-balance">
					<span>Total: <b>{{ money(summary.total) }}</b></span>
					<span>Abonado: <b>{{ money(summary.paid) }}</b></span>
					<span class="pfm-due">Pendiente: <b>{{ money(summary.balanceDue) }}</b></span>
				</div>

				<form class="pfm-form" @submit.prevent="onSubmit">
					<div class="pfm-field">
						<label class="pfm-label">Monto <span class="pfm-required">*</span></label>
						<input
							v-model.number="amount"
							type="number"
							min="0.01"
							step="0.01"
							required
						/>
					</div>

					<div class="pfm-field">
						<label class="pfm-label">Medio de pago <span class="pfm-required">*</span></label>
						<select v-model="method" required>
							<option v-for="opt in PAYMENT_METHODS" :key="opt.value" :value="opt.value">
								{{ opt.label }}
							</option>
						</select>
					</div>

					<div class="pfm-field">
						<label class="pfm-label">Fecha <span class="pfm-required">*</span></label>
						<input v-model="date" type="date" required />
					</div>

					<div class="pfm-field">
						<label class="pfm-label">Referencia</label>
						<input v-model="reference" type="text" maxlength="100" placeholder="Nro. recibo, transferencia..." />
					</div>

					<div class="pfm-field pfm-full">
						<label class="pfm-label">Notas</label>
						<textarea v-model="notes" rows="2" placeholder="Observaciones (opcional)" />
					</div>

					<p v-if="error" class="pfm-error pfm-full">{{ error }}</p>

					<div class="pfm-actions">
						<button type="button" class="pfm-btn pfm-btn-outline" @click="emit('close')">
							Cancelar
						</button>
						<button type="submit" class="pfm-btn pfm-btn-primary" :disabled="!isValid || saving">
							{{ saving ? 'Registrando...' : `Registrar ${verb.toLowerCase()}` }}
						</button>
					</div>
				</form>
			</template>

			<div v-else class="pfm-actions">
				<button type="button" class="pfm-btn pfm-btn-outline" @click="emit('close')">
					Cerrar
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.pfm-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.pfm-card {
	background: #fff;
	padding: 24px;
	border-radius: 8px;
	width: 480px;
	max-width: 96vw;
	max-height: 90vh;
	overflow-y: auto;
}

.pfm-title {
	margin: 0 0 4px;
	color: #2c3e50;
}

.pfm-subtitle {
	margin: 0 0 16px;
	color: #6c757d;
	font-size: 0.9rem;
}

.pfm-message {
	padding: 16px 0;
	color: #6c757d;
}

.pfm-balance {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
	padding: 12px;
	margin-bottom: 16px;
	background: #f8f9fa;
	border-radius: 6px;
	color: #495057;
	font-size: 0.9rem;
}

.pfm-due {
	color: #2c3e50;
}

.pfm-form {
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
}

.pfm-field {
	flex: 1 1 calc(50% - 7px);
	min-width: 180px;
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.pfm-full {
	flex-basis: 100%;
}

.pfm-label {
	font-size: 0.85rem;
	color: #495057;
}

.pfm-required {
	color: #dc3545;
}

.pfm-field input,
.pfm-field select,
.pfm-field textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 8px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.pfm-error {
	color: #dc3545;
	font-size: 0.9rem;
	margin: 0;
}

.pfm-actions {
	flex-basis: 100%;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 4px;
}

.pfm-btn {
	padding: 8px 16px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	font: inherit;
}

.pfm-btn-outline {
	background: #fff;
	border: 1px solid #ced4da;
	color: #333;
}

.pfm-btn-primary {
	background: #1976d2;
	color: #fff;
}

.pfm-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
</style>
