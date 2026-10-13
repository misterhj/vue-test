<script setup lang="ts">
import { computed, ref } from 'vue'
import ResourceListView from '@/components/ResourceListView.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const selectedBrandId = ref<number | string | null>(null)

const canReadBrands = computed(() => authStore.hasPermission('brands:read'))
const canReadModels = computed(() => authStore.hasPermission('models:read'))

const showModels = computed(
	() => canReadModels.value && (!canReadBrands.value || selectedBrandId.value !== null),
)
const modelKey = computed(() => selectedBrandId.value ?? 'all')
const modelFilters = computed<Record<string, unknown> | undefined>(() =>
	selectedBrandId.value !== null ? { brandId: selectedBrandId.value } : undefined,
)

function onBrandClick(row: Record<string, unknown>) {
	selectedBrandId.value = row.id as number
}
</script>

<template>
	<div class="bm-view">
		<div v-if="canReadBrands" class="bm-pane bm-pane-left">
			<ResourceListView
				resource="brands"
				selectable
				:selected-id="selectedBrandId"
				@row-click="onBrandClick"
			/>
		</div>

		<div class="bm-pane bm-pane-right">
			<ResourceListView
				v-if="showModels"
				:key="modelKey"
				resource="models"
				:forced-filters="modelFilters"
			/>
			<div v-else class="bm-placeholder">
				Seleccioná una marca para ver sus modelos
			</div>
		</div>
	</div>
</template>

<style scoped>
.bm-view {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	gap: 16px;
}

.bm-pane {
	display: flex;
	min-height: 0;
}

.bm-pane-left {
	flex: 0 0 360px;
	max-width: 360px;
}

.bm-pane-right {
	flex: 1 1 auto;
	min-width: 0;
}

.bm-placeholder {
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
	.bm-view {
		flex-direction: column;
	}

	.bm-pane-left {
		flex: 0 0 auto;
		max-width: none;
	}
}
</style>
