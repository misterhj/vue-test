<script setup lang="ts">
import { computed, ref } from 'vue'
import ResourceListView from '@/components/ResourceListView.vue'

const selectedCategoryId = ref<number | string | null>(null)

const showSubcategories = computed(() => selectedCategoryId.value !== null)
const subcategoryKey = computed(() => selectedCategoryId.value ?? 'none')
const subcategoryFilters = computed<Record<string, unknown> | undefined>(() =>
	selectedCategoryId.value !== null
		? { parentCategoryId: selectedCategoryId.value }
		: undefined,
)

function onCategoryClick(row: Record<string, unknown>) {
	selectedCategoryId.value = row.id as number
}
</script>

<template>
	<div class="cs-view">
		<div class="cs-pane cs-pane-left">
			<ResourceListView
				resource="categories"
				selectable
				:selected-id="selectedCategoryId"
				@row-click="onCategoryClick"
			/>
		</div>

		<div class="cs-pane cs-pane-right">
			<ResourceListView
				v-if="showSubcategories"
				:key="subcategoryKey"
				resource="subcategories"
				:forced-filters="subcategoryFilters"
			/>
			<div v-else class="cs-placeholder">
				Seleccioná una categoría para ver sus subcategorías
			</div>
		</div>
	</div>
</template>

<style scoped>
.cs-view {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	gap: 16px;
}

.cs-pane {
	display: flex;
	min-height: 0;
}

.cs-pane-left {
	flex: 0 0 360px;
	max-width: 360px;
}

.cs-pane-right {
	flex: 1 1 auto;
	min-width: 0;
}

.cs-placeholder {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border-radius: 8px;
	padding: 24px;
	color: #6c757d;
	text-align: center;
}

@media (max-width: 900px) {
	.cs-view {
		flex-direction: column;
	}

	.cs-pane-left {
		flex: 0 0 auto;
		max-width: none;
	}
}
</style>
