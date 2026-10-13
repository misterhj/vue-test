<script setup lang="ts">
import { computed } from 'vue'
import type {
	ResourceColumnFilterDef,
	ResourceColumnFilterValue,
	ResourceListFilterOption,
} from '@/config/resource-list.types'
import MultiSelectFilter from './MultiSelectFilter.vue'

const props = defineProps<{
	def: ResourceColumnFilterDef | null
	options?: ResourceListFilterOption[]
	value?: ResourceColumnFilterValue
	text?: string
}>()

const emit = defineEmits<{
	(e: 'update:text', def: ResourceColumnFilterDef, value: string): void
	(e: 'update:value', def: ResourceColumnFilterDef, value: ResourceColumnFilterValue): void
}>()

const resolvedOptions = computed(() => props.options ?? props.def?.options ?? [])

const multiValue = computed<Array<string | number | boolean>>(() => {
	if (Array.isArray(props.value)) {
		return props.value
	}
	if (props.value === undefined || props.value === null || props.value === '') {
		return []
	}
	return [props.value]
})

const scalarValue = computed(() =>
	props.value === undefined || props.value === null ? '' : String(props.value),
)

function onText(event: Event) {
	if (props.def) {
		emit('update:text', props.def, (event.target as HTMLInputElement).value)
	}
}

function onSelect(event: Event) {
	if (!props.def) {
		return
	}
	const raw = (event.target as HTMLSelectElement).value
	if (raw === '') {
		emit('update:value', props.def, '')
		return
	}
	const option = resolvedOptions.value.find((item) => String(item.value) === raw)
	emit('update:value', props.def, option ? option.value : raw)
}

function onDate(event: Event) {
	if (props.def) {
		emit('update:value', props.def, (event.target as HTMLInputElement).value)
	}
}

function onMulti(values: Array<string | number | boolean>) {
	if (!props.def) {
		return
	}
	if (props.def.multiple) {
		emit('update:value', props.def, values)
	} else {
		emit('update:value', props.def, values[0] ?? '')
	}
}
</script>

<template>
	<template v-if="def">
		<MultiSelectFilter
			v-if="def.type === 'select' && !def.boolean"
			:multiple="def.multiple"
			:options="resolvedOptions"
			:model-value="multiValue"
			:placeholder="def.placeholder"
			@update:model-value="onMulti"
		/>

		<select v-else-if="def.type === 'select'" :value="scalarValue" @change="onSelect">
			<option value="">Todos</option>
			<option
				v-for="option in resolvedOptions"
				:key="String(option.value)"
				:value="String(option.value)"
			>
				{{ option.label }}
			</option>
		</select>

		<input
			v-else-if="def.type === 'date'"
			type="date"
			:value="scalarValue"
			@change="onDate"
		/>

		<input
			v-else
			:type="def.type === 'number' ? 'number' : 'text'"
			:value="text ?? ''"
			:placeholder="def.placeholder"
			@input="onText"
		/>
	</template>
</template>

<style scoped>
select,
input {
	width: 100%;
	min-width: 80px;
	box-sizing: border-box;
	padding: 5px 6px;
	border: 1px solid #ced4da;
	border-radius: 4px;
	font: inherit;
	font-size: 0.8rem;
	background: #fff;
}

input::placeholder {
	color: #adb5bd;
}
</style>
