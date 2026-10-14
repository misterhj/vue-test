<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import type { ResourceFormField } from '@/config/resource-list.types'
import { getOptions } from '@/services/list.services'

interface Option {
	value: string | number | boolean
	label: string
}

const props = defineProps<{
	title: string
	fields: ResourceFormField[]
	initial?: Record<string, unknown>
	/** `id` de la entidad en edición (para sub-paneles como media o direcciones). */
	entityId?: number | null
	saving?: boolean
	error?: string
}>()

const emit = defineEmits<{
	(e: 'save', payload: Record<string, unknown>): void
	(e: 'close'): void
}>()

const form = reactive<Record<string, unknown>>({})
const options = reactive<Record<string, Option[]>>({})

function initValue(field: ResourceFormField): unknown {
	if (props.initial && props.initial[field.key] !== undefined) {
		return props.initial[field.key]
	}
	if (field.defaultValue !== undefined) {
		return field.type === 'number' ? Number(field.defaultValue) : field.defaultValue
	}
	if (field.type === 'boolean') {
		return false
	}
	return ''
}

props.fields.forEach((field) => {
	form[field.key] = initValue(field)
})

async function loadOptions() {
	for (const field of props.fields) {
		if (field.type !== 'select') {
			continue
		}
		if (field.options) {
			options[field.key] = field.options
		} else if (field.optionsResource) {
			try {
				options[field.key] = await getOptions(field.optionsResource, field.optionLabel)
			} catch {
				options[field.key] = []
			}
		}
	}
}

function buildPayload(): Record<string, unknown> {
	const payload: Record<string, unknown> = {}
	for (const field of props.fields) {
		const value = form[field.key]
		if (field.type === 'boolean') {
			payload[field.key] = Boolean(value)
			continue
		}
		if (value === '' || value === undefined || value === null) {
			continue
		}
		if (field.type === 'number') {
			const numeric = Number(value)
			if (!Number.isNaN(numeric)) {
				payload[field.key] = numeric
			}
			continue
		}
		payload[field.key] = value
	}
	return payload
}

function isValid(): boolean {
	return props.fields.every((field) => {
		if (!field.required) {
			return true
		}
		const value = form[field.key]
		if (field.type === 'number') {
			return value !== '' && value !== undefined && value !== null
		}
		if (field.type === 'boolean') {
			return true
		}
		return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null
	})
}

function textValue(field: ResourceFormField): string {
	const v = form[field.key]
	return typeof v === 'string' ? v : ''
}

function onTextInput(field: ResourceFormField, event: Event) {
	form[field.key] = (event.target as HTMLInputElement).value
}

function numberValue(field: ResourceFormField): number | null {
	const v = form[field.key]
	return typeof v === 'number' ? v : null
}

function onNumberInput(field: ResourceFormField, event: Event) {
	const raw = (event.target as HTMLInputElement).value
	form[field.key] = raw === '' ? '' : Number(raw)
}

function selectValue(field: ResourceFormField): string | number {
	const v = form[field.key]
	return typeof v === 'string' || typeof v === 'number' ? v : ''
}

function booleanValue(field: ResourceFormField): boolean {
	return Boolean(form[field.key])
}

function onBooleanChange(field: ResourceFormField, event: Event) {
	form[field.key] = (event.target as HTMLInputElement).checked
}

function onSubmit() {
	emit('save', buildPayload())
}

function onSelectChange(field: ResourceFormField, raw: string) {
	if (raw === '') {
		form[field.key] = ''
		return
	}
	const opt = (options[field.key] ?? []).find((o) => String(o.value) === raw)
	form[field.key] = opt ? opt.value : raw
}

onMounted(loadOptions)
</script>

<template>
	<div class="rfm-overlay" @click.self="emit('close')">
		<div class="rfm-card">
			<h3 class="rfm-title">{{ title }}</h3>

			<form class="rfm-form" @submit.prevent="onSubmit">
				<div
					v-for="field in fields"
					:key="field.key"
					class="rfm-field"
					:class="{ 'rfm-full': field.fullWidth }"
				>					<label class="rfm-label">
						{{ field.label }}
						<span v-if="field.required" class="rfm-required">*</span>
					</label>

					<input
						v-if="field.type === 'text'"
						:value="textValue(field)"
						type="text"
						:placeholder="field.placeholder"
						:maxlength="field.maxLength"
						@input="onTextInput(field, $event)"
					/>

					<textarea
						v-else-if="field.type === 'textarea'"
						:value="textValue(field)"
						:placeholder="field.placeholder"
						:maxlength="field.maxLength"
						rows="3"
						@input="onTextInput(field, $event)"
					/>

					<input
						v-else-if="field.type === 'number'"
						:value="numberValue(field)"
						type="number"
						:min="field.min"
						:max="field.max"
						:step="field.step"
						:placeholder="field.placeholder"
						@input="onNumberInput(field, $event)"
					/>

					<select
						v-else-if="field.type === 'select'"
						:value="selectValue(field)"
						@change="onSelectChange(field, ($event.target as HTMLSelectElement).value)"
						:required="field.required"
					>
						<option value="">{{ field.required ? '— Seleccionar —' : '—' }}</option>
						<option
							v-for="opt in options[field.key] ?? []"
							:key="String(opt.value)"
							:value="opt.value"
						>
							{{ opt.label }}
						</option>
					</select>

					<input
						v-else-if="field.type === 'date'"
						:value="textValue(field)"
						type="date"
						@input="onTextInput(field, $event)"
					/>

					<label v-else-if="field.type === 'boolean'" class="rfm-checkbox">
						<input
							type="checkbox"
							:checked="booleanValue(field)"
							@change="onBooleanChange(field, $event)"
						/>
						<span>{{ field.label }}</span>
					</label>
				</div>

				<div v-if="$slots.extra" class="rfm-subpanel">
					<slot name="extra" :entity-id="entityId ?? null"></slot>
				</div>

				<p v-if="error" class="rfm-error">{{ error }}</p>

				<div class="rfm-actions">
					<button type="button" class="rfm-btn rfm-btn-outline" @click="emit('close')">
						Cancelar
					</button>
					<button
						type="submit"
						class="rfm-btn rfm-btn-primary"
						:disabled="!isValid() || saving"
					>
						{{ saving ? 'Guardando...' : 'Guardar' }}
					</button>
				</div>
			</form>
		</div>
	</div>
</template>

<style scoped>
.rfm-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
}

.rfm-card {
	background: #fff;
	padding: 24px;
	border-radius: 8px;
	width: 620px;
	max-width: 94vw;
	max-height: 88vh;
	overflow-y: auto;
}

.rfm-title {
	margin: 0 0 18px;
	color: #2c3e50;
}

.rfm-form {
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
}

.rfm-field {
	flex: 1 1 calc(50% - 7px);
	min-width: 220px;
	display: flex;
	flex-direction: column;
	gap: 5px;
}

.rfm-full {
	flex-basis: 100%;
}

.rfm-subpanel {
	flex-basis: 100%;
	margin-top: 4px;
}

.rfm-label {
	font-size: 0.85rem;
	color: #495057;
}

.rfm-required {
	color: #dc3545;
}

.rfm-field input[type='text'],
.rfm-field input[type='number'],
.rfm-field input[type='date'],
.rfm-field select,
.rfm-field textarea {
	width: 100%;
	box-sizing: border-box;
	padding: 8px 10px;
	border: 1px solid #ccc;
	border-radius: 4px;
	font: inherit;
}

.rfm-checkbox {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.9rem;
	color: #333;
}

.rfm-error {
	flex-basis: 100%;
	margin: 0;
	color: #dc3545;
	font-size: 0.9rem;
}

.rfm-actions {
	flex-basis: 100%;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 8px;
}

.rfm-btn {
	padding: 8px 16px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	font: inherit;
}

.rfm-btn-outline {
	background: #fff;
	border: 1px solid #ced4da;
	color: #333;
}

.rfm-btn-primary {
	background: #1976d2;
	color: #fff;
}

.rfm-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
</style>