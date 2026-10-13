<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import type { ResourceListFilterOption } from '@/config/resource-list.types'

type OptionValue = string | number | boolean

const props = withDefaults(
	defineProps<{
		options: ResourceListFilterOption[]
		modelValue: OptionValue[]
		placeholder?: string
		/** Si es `true` admite varias opciones; si es `false`, solo una. */
		multiple?: boolean
	}>(),
	{ multiple: true },
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: OptionValue[]): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const query = ref('')
const open = ref(false)
const panelStyle = ref<Record<string, string>>({})

const selected = computed(() =>
	props.options.filter((option) => props.modelValue.includes(option.value)),
)

const filtered = computed(() => {
	const term = query.value.trim().toLowerCase()
	if (!term) {
		return props.options
	}
	return props.options.filter((option) => option.label.toLowerCase().includes(term))
})

function updatePosition() {
	const el = rootRef.value
	if (!el) {
		return
	}
	const rect = el.getBoundingClientRect()
	panelStyle.value = {
		position: 'fixed',
		top: `${rect.bottom + 4}px`,
		left: `${rect.left}px`,
		width: `${rect.width}px`,
	}
}

function openPanel() {
	if (open.value) {
		return
	}
	open.value = true
	updatePosition()
	nextTick(updatePosition)
	document.addEventListener('mousedown', onDocumentMouseDown)
	window.addEventListener('resize', updatePosition)
	window.addEventListener('scroll', updatePosition, true)
}

function closePanel() {
	if (!open.value) {
		return
	}
	open.value = false
	query.value = ''
	document.removeEventListener('mousedown', onDocumentMouseDown)
	window.removeEventListener('resize', updatePosition)
	window.removeEventListener('scroll', updatePosition, true)
}

function onDocumentMouseDown(event: MouseEvent) {
	const target = event.target as HTMLElement
	if (rootRef.value?.contains(target) || target.closest('.rl-multi-panel')) {
		return
	}
	closePanel()
}

function toggle(option: ResourceListFilterOption) {
	if (!props.multiple) {
		emit('update:modelValue', [option.value])
		closePanel()
		return
	}
	const exists = props.modelValue.includes(option.value)
	const next = exists
		? props.modelValue.filter((value) => value !== option.value)
		: [...props.modelValue, option.value]
	emit('update:modelValue', next)
}

function remove(value: OptionValue) {
	emit(
		'update:modelValue',
		props.modelValue.filter((item) => item !== value),
	)
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		closePanel()
	}
}

onBeforeUnmount(closePanel)
</script>

<template>
	<div ref="rootRef" class="rl-multi" @click="openPanel">
		<span v-for="option in selected" :key="String(option.value)" class="rl-multi-chip">
			{{ option.label }}
			<button
				type="button"
				class="rl-multi-chip-x"
				aria-label="Quitar"
				@click.stop="remove(option.value)"
			>
				×
			</button>
		</span>
		<input
			v-model="query"
			class="rl-multi-input"
			type="text"
			:placeholder="selected.length ? '' : (placeholder ?? 'Buscar...')"
			:size="selected.length ? 4 : 12"
			@focus="openPanel"
			@keydown="onKeydown"
		/>
	</div>

	<Teleport to="body">
		<div v-if="open" class="rl-multi-panel" :style="panelStyle">
			<label
				v-for="option in filtered"
				:key="String(option.value)"
				class="rl-multi-option"
			>
				<input
					:type="multiple ? 'checkbox' : 'radio'"
					:checked="modelValue.includes(option.value)"
					@change="toggle(option)"
				/>
				<span>{{ option.label }}</span>
			</label>
			<div v-if="filtered.length === 0" class="rl-multi-empty">Sin resultados</div>
		</div>
	</Teleport>
</template>

<style scoped>
.rl-multi {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
	min-height: 30px;
	padding: 3px 4px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	background: #fff;
	cursor: text;
}

.rl-multi:focus-within {
	border-color: #1976d2;
}

.rl-multi-chip {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	padding: 1px 4px 1px 6px;
	background: #e3f2fd;
	color: #1565c0;
	border-radius: 3px;
	font-size: 0.75rem;
	max-width: 100%;
}

.rl-multi-chip-x {
	border: none;
	background: transparent;
	color: #1565c0;
	cursor: pointer;
	font-size: 0.9rem;
	line-height: 1;
	padding: 0 2px;
}

.rl-multi-input {
	flex: 1;
	min-width: 70px;
	border: none;
	outline: none;
	padding: 2px;
	font: inherit;
	font-size: 0.8rem;
	background: transparent;
}

.rl-multi-panel {
	z-index: 2000;
	max-height: 240px;
	overflow-y: auto;
	background: #fff;
	border: 1px solid #dee2e6;
	border-radius: 4px;
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
	padding: 4px;
}

.rl-multi-option {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 8px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.85rem;
	color: #333;
}

.rl-multi-option:hover {
	background: #f1f3f5;
}

.rl-multi-empty {
	padding: 8px;
	font-size: 0.8rem;
	color: #868e96;
	text-align: center;
}
</style>
