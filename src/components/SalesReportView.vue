<template>
  <div class="report-view">
    <div class="view-header">
      <h1>Ventas por período</h1>
      <div class="filters">
        <label>
          Desde
          <input v-model="dateFrom" type="date" />
        </label>
        <label>
          Hasta
          <input v-model="dateTo" type="date" />
        </label>
        <label>
          Agrupar
          <select v-model="groupBy">
            <option value="month">Mes</option>
            <option value="day">Día</option>
          </select>
        </label>
        <button class="btn btn-primary" @click="load" :disabled="loading">Consultar</button>
        <button class="btn btn-secondary" @click="clear" :disabled="loading">Limpiar</button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="loading" class="loading">Cargando...</div>

    <div v-if="report" class="totals">
      <div class="total-card">
        <span class="label">Ventas</span>
        <span class="value">{{ report.totals.count }}</span>
      </div>
      <div class="total-card">
        <span class="label">Subtotal</span>
        <span class="value">{{ formatMoney(report.totals.subtotal) }}</span>
      </div>
      <div class="total-card">
        <span class="label">Descuento</span>
        <span class="value">{{ formatMoney(report.totals.discountTotal) }}</span>
      </div>
      <div class="total-card">
        <span class="label">Total</span>
        <span class="value">{{ formatMoney(report.totals.total) }}</span>
      </div>
    </div>

    <div v-if="report && report.series.length" class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Período</th>
            <th class="text-right">Ventas</th>
            <th class="text-right">Subtotal</th>
            <th class="text-right">Descuento</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in report.series" :key="p.period">
            <td>{{ p.period }}</td>
            <td class="text-right">{{ p.count }}</td>
            <td class="text-right">{{ formatMoney(p.subtotal) }}</td>
            <td class="text-right">{{ formatMoney(p.discountTotal) }}</td>
            <td class="text-right">{{ formatMoney(p.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="report && !report.series.length" class="empty">Sin datos para el rango seleccionado</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { reportsService, type SalesReport, type GroupBy } from '@/services/reports.services'

const dateFrom = ref('')
const dateTo = ref('')
const groupBy = ref<GroupBy>('month')
const loading = ref(false)
const error = ref('')
const report = ref<SalesReport | null>(null)

function formatMoney(v: number): string {
	return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(v)
}

async function load() {
	loading.value = true
	error.value = ''
	try {
		report.value = await reportsService.getSales({
			dateFrom: dateFrom.value || undefined,
			dateTo: dateTo.value || undefined,
			groupBy: groupBy.value,
		})
	} catch (e: unknown) {
		const err = e as { response?: { data?: { message?: string } }; message?: string }
		error.value = err?.response?.data?.message || err?.message || 'Error al cargar reporte'
	} finally {
		loading.value = false
	}
}

function clear() {
	dateFrom.value = ''
	dateTo.value = ''
	groupBy.value = 'month'
	report.value = null
	error.value = ''
}
</script>

<style scoped>
.report-view { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.view-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 1rem; }
.filters { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; }
label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
input, select { padding: 0.375rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
.totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
.total-card { background: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
.label { font-size: 0.875rem; color: #666; }
.value { font-size: 1.25rem; font-weight: 600; }
.table-wrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e5e5; text-align: left; }
.text-right { text-align: right; }
.empty { text-align: center; color: #666; padding: 1rem; }
</style>
