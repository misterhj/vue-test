import api from './api'

export interface PartySummary {
	id: number
	displayName: string | null
}

export interface Paginated<T> {
	data: T[]
	current_page: number
	last_page: number
	total: number
	[key: string]: unknown
}

export type GroupBy = 'day' | 'month'

export interface SalesReportPoint {
	period: string
	count: number
	subtotal: number
	discountTotal: number
	total: number
}

export interface SalesReportTotals {
	count: number
	subtotal: number
	discountTotal: number
	total: number
}

export interface SalesReport {
	dateFrom: string | null
	dateTo: string | null
	groupBy: GroupBy
	totals: SalesReportTotals
	series: SalesReportPoint[]
}

export interface StockValuationRow {
	productId: number
	name: string | null
	code: string | null
	stock: number
	unitPrice: number
	saleValue: number
	avgCost: number | null
	costValue: number | null
}

export interface StockValuationTotals {
	totalUnits: number
	totalSaleValue: number
	totalCostValue: number
}

export interface PaginatedStockValuation extends Paginated<StockValuationRow> {
	totals: StockValuationTotals
}

export interface ReceivableRow {
	saleId: number
	number: string | null
	date: string
	customerId: number | null
	customer: PartySummary | null
	total: number
	paid: number
	balanceDue: number
}

export interface PayableRow {
	purchaseId: number
	number: string | null
	date: string
	supplierId: number | null
	supplier: PartySummary | null
	total: number
	paid: number
	balanceDue: number
}

export interface BalanceTotals {
	total: number
	paid: number
	balanceDue: number
}

export interface PaginatedReceivables extends Paginated<ReceivableRow> {
	totals: BalanceTotals
}

export interface PaginatedPayables extends Paginated<PayableRow> {
	totals: BalanceTotals
}

export interface SalesReportParams {
	dateFrom?: string
	dateTo?: string
	groupBy?: GroupBy
}

export interface StockValuationParams {
	search?: string
	onlyInStock?: boolean
	page?: number
	limit?: number
}

export interface BalanceParams {
	search?: string
	page?: number
	limit?: number
}

export const reportsService = {
	async getSales(params: SalesReportParams = {}): Promise<SalesReport> {
		const res = await api.get<SalesReport>('/reports/sales', { params })
		return res.data
	},

	async getStockValuation(params: StockValuationParams = {}): Promise<PaginatedStockValuation> {
		const res = await api.get<PaginatedStockValuation>('/reports/stock-valuation', { params })
		return res.data
	},

	async getReceivables(params: BalanceParams = {}): Promise<PaginatedReceivables> {
		const res = await api.get<PaginatedReceivables>('/reports/receivables', { params })
		return res.data
	},

	async getPayables(params: BalanceParams = {}): Promise<PaginatedPayables> {
		const res = await api.get<PaginatedPayables>('/reports/payables', { params })
		return res.data
	}
}
