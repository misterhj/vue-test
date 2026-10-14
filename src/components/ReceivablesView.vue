<template>
  <div class="report-view">
    <div class="view-header">
      <h1>Cuentas por cobrar</h1>
      <div class="filters">
        <label>
          Búsqueda
          <input v-model="search" placeholder="Número o cliente" />
        </label>
        <button class="btn btn-primary" @click="load(1)" :disabled="loading">Consultar</button>
        <button class="btn btn-secondary" @click="clear" :disabled="loading">Limpiar</button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="loading" class="loading">Cargando...</div>

    <div v-if="data" class="totals">
      <div class="total-card">
        <span class="label">Total</span>
        <span class="value">{{ formatMoney(data.totals.total) }}</span>
      </div>
      <div class="total-card">
        <span class="label">Abonado</span>
        <span class="value">{{ formatMoney(data.totals.paid) }}</span>
      </div>
      <div class="total-card">
        <span class="label">Saldo</span>
        <span class="value">{{ formatMoney(data.totals.balanceDue) }}</span>
      </div>
    </div>

    <div v-if="data && data.data.length" class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Venta</th>
            <th>N°</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th class="text-right">Total</th>
            <th class="text-right">Abonado</th>
            <th class="text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in data.data" :key="r.saleId">
            <td>#{{ r.saleId }}</td>
            <td>{{ r.number }}</td>
            <td>{{ r.date }}</td>
            <td>{{ r.customer?.displayName || '-' }}</td>
            <td class="text-right">{{ formatMoney(r.total) }}</td>
            <td class="text-right">{{ formatMoney(r.paid) }}</td>
            <td class="text-right">{{ formatMoney(r.balanceDue) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button :disabled="loading || page===1" @click="load(page-1)">Anterior</button>
        <span>Página {{ page }} / {{ data.last_page }}</span>
        <button :disabled="loading || page===data.last_page" @click="load(page+1)">Siguiente</button>
      </div>
    </div>
    <div v-else-if="data && !data.data.length" class="empty">Sin resultados</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { reportsService, type PaginatedReceivables } from '@/services/reports.services'

const search = ref('')
const page = ref(1)
const limit = ref(10)
const loading = ref(false)
const error = ref('')
const data = ref<PaginatedReceivables | null>(null)

function formatMoney(v: number): string {
	return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(v)
}

async function load(p = 1) {
	loading.value = true
	error.value = ''
	page.value = p
	try {
		data.value = await reportsService.getReceivables({
			search: search.value || undefined,
			page: page.value,
			limit: limit.value,
		})
	} catch (e: unknown) {
		const err = e as { response?: { data?: { message?: string } }; message?: string }
		error.value = err?.response?.data?.message || err?.message || 'Error al cargar reporte'
	} finally {
		loading.value = false
	}
}

function clear() {
	search.value = ''
	data.value = null
	error.value = ''
}
</script>

<style scoped>
.report-view { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.view-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 1rem; }
.filters { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; }
label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
input { padding: 0.375rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
.totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
.total-card { background: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
.label { font-size: 0.875rem; color: #666; }
.value { font-size: 1.25rem; font-weight: 600; }
.table-wrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e5e5; text-align: left; }
.text-right { text-align: right; }
.pagination { display: flex; gap: 1rem; align-items: center; justify-content: center; margin-top: 1rem; }
.empty { text-align: center; color: #666; padding: 1rem; }
</style>
