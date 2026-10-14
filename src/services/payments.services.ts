import api from './api'
import type { DocumentParty } from './documents.types'

export type PaymentType = 'collection' | 'payment'
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other'
export type PaymentStatus = 'pending' | 'partial' | 'paid'

export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
	{ value: 'cash', label: 'Efectivo' },
	{ value: 'transfer', label: 'Transferencia' },
	{ value: 'card', label: 'Tarjeta' },
	{ value: 'other', label: 'Otro' },
]

export interface Payment {
	id: number
	type: PaymentType
	saleId: number | null
	purchaseId: number | null
	customerId: number | null
	customer: DocumentParty | null
	supplierId: number | null
	supplier: DocumentParty | null
	amount: number
	method: PaymentMethod
	date: string
	reference: string | null
	notes: string | null
	createdAt: string
	updatedAt: string
}

/** Saldo derivado de un documento (venta o compra). */
export interface PaymentSummary {
	saleId: number | null
	purchaseId: number | null
	total: number
	paid: number
	balanceDue: number
	paymentCount: number
	status: PaymentStatus
}

export interface PaymentInput {
	saleId?: number
	purchaseId?: number
	amount: number
	method: PaymentMethod
	date: string
	reference?: string
	notes?: string
}

export interface PaymentListParams {
	search?: string
	page?: number
	limit?: number
	saleId?: number
	purchaseId?: number
	customerId?: number
	supplierId?: number
	method?: PaymentMethod
	dateFrom?: string
	dateTo?: string
}

export interface PaginatedPayments {
	data: Payment[]
	current_page: number
	last_page: number
	total: number
}

/** Endpoint dedicado `GET /payments` (no está en el listado genérico `/list`). */
export const paymentService = {
	async list(params: PaymentListParams = {}): Promise<PaginatedPayments> {
		const response = await api.get<PaginatedPayments>('/payments', { params })
		return response.data
	},

	async getOne(id: number): Promise<Payment> {
		const response = await api.get<Payment>(`/payments/${id}`)
		return response.data
	},

	async summary(where: { saleId?: number; purchaseId?: number }): Promise<PaymentSummary> {
		const response = await api.get<PaymentSummary>('/payments/summary', { params: where })
		return response.data
	},

	async create(data: PaymentInput): Promise<Payment> {
		const response = await api.post<Payment>('/payments', data)
		return response.data
	},

	async remove(id: number): Promise<void> {
		await api.delete(`/payments/${id}`)
	},
}
