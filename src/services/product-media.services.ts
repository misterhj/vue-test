import api from './api'

export interface ProductMedia {
	id: number
	productId: number
	url: string | null
	mediaType: string
	isPrimary: boolean
	createdAt: string
	updatedAt: string
}

export interface ProductMediaInput {
	url?: string | null
	mediaType?: string
	isPrimary?: boolean
}

export const productMediaService = {
	async list(productId: number): Promise<ProductMedia[]> {
		const response = await api.get<ProductMedia[]>(`/products/${productId}/media`)
		return response.data
	},

	async create(productId: number, data: ProductMediaInput): Promise<ProductMedia> {
		const response = await api.post<ProductMedia>(`/products/${productId}/media`, data)
		return response.data
	},

	async update(
		productId: number,
		id: number,
		data: ProductMediaInput,
	): Promise<ProductMedia> {
		const response = await api.patch<ProductMedia>(
			`/products/${productId}/media/${id}`,
			data,
		)
		return response.data
	},

	async remove(productId: number, id: number): Promise<void> {
		await api.delete(`/products/${productId}/media/${id}`)
	},
}
