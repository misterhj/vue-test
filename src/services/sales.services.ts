import api from './api'
import { listService, type ListParams, type PaginatedResponse } from './list.services'
import type { DocumentParty, DocumentProduct, DocumentStatus } from './documents.types'

export interface SaleItem {
	id: number
	productId: number | null
	product: DocumentProduct | null
	quantity: number
	unitPrice: number
	discount: number
	lineTotal: number
}

export interface Sale {
	id: number
	number: string | null
	customerId: number | null
	customer: DocumentParty | null
	date: string
	status: DocumentStatus
	subtotal: number
	discountTotal: number
	total: number
	notes: string | null
	confirmedAt: string | null
	items: SaleItem[]
	createdAt: string
	updatedAt: string
}

export interface SaleItemInput {
	productId: number
	quantity: number
	unitPrice: number
	discount?: number
}

export interface SaleInput {
	customerId: number
	date: string
	notes?: string
	items: SaleItemInput[]
}

export const saleService = {
	/** Listado paginado vía el endpoint genérico `POST /list/sales`. */
	getAll(params: ListParams = {}): Promise<PaginatedResponse<Sale>> {
		return listService.getAll<Sale>('sales', params)
	},

	async getOne(id: number): Promise<Sale> {
		const response = await api.get<Sale>(`/sales/${id}`)
		return response.data
	},

	async create(data: SaleInput): Promise<Sale> {
		const response = await api.post<Sale>('/sales', data)
		return response.data
	},

	async update(id: number, data: Partial<SaleInput>): Promise<Sale> {
		const response = await api.patch<Sale>(`/sales/${id}`, data)
		return response.data
	},

	async remove(id: number): Promise<void> {
		await api.delete(`/sales/${id}`)
	},

	async confirm(id: number): Promise<Sale> {
		const response = await api.post<Sale>(`/sales/${id}/confirm`)
		return response.data
	},

	async cancel(id: number): Promise<Sale> {
		const response = await api.post<Sale>(`/sales/${id}/cancel`)
		return response.data
	},
}
