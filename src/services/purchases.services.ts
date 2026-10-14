import api from './api'
import { listService, type ListParams, type PaginatedResponse } from './list.services'
import type { DocumentParty, DocumentProduct, DocumentStatus } from './documents.types'

export interface PurchaseItem {
	id: number
	productId: number | null
	product: DocumentProduct | null
	quantity: number
	unitCost: number
	discount: number
	lineTotal: number
}

export interface Purchase {
	id: number
	number: string | null
	supplierId: number | null
	supplier: DocumentParty | null
	date: string
	status: DocumentStatus
	subtotal: number
	discountTotal: number
	total: number
	notes: string | null
	confirmedAt: string | null
	items: PurchaseItem[]
	createdAt: string
	updatedAt: string
}

export interface PurchaseItemInput {
	productId: number
	quantity: number
	unitCost: number
	discount?: number
}

export interface PurchaseInput {
	supplierId: number
	date: string
	notes?: string
	items: PurchaseItemInput[]
}

export const purchaseService = {
	/** Listado paginado vía el endpoint genérico `POST /list/purchases`. */
	getAll(params: ListParams = {}): Promise<PaginatedResponse<Purchase>> {
		return listService.getAll<Purchase>('purchases', params)
	},

	async getOne(id: number): Promise<Purchase> {
		const response = await api.get<Purchase>(`/purchases/${id}`)
		return response.data
	},

	async create(data: PurchaseInput): Promise<Purchase> {
		const response = await api.post<Purchase>('/purchases', data)
		return response.data
	},

	async update(id: number, data: Partial<PurchaseInput>): Promise<Purchase> {
		const response = await api.patch<Purchase>(`/purchases/${id}`, data)
		return response.data
	},

	async remove(id: number): Promise<void> {
		await api.delete(`/purchases/${id}`)
	},

	async confirm(id: number): Promise<Purchase> {
		const response = await api.post<Purchase>(`/purchases/${id}/confirm`)
		return response.data
	},

	async cancel(id: number): Promise<Purchase> {
		const response = await api.post<Purchase>(`/purchases/${id}/cancel`)
		return response.data
	},
}
