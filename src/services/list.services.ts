import api from './api'

export interface ListParams {
	search?: string
	page?: number
	limit?: number
	sortBy?: string
	sortOrder?: 'ASC' | 'DESC'
	filters?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
	data: T[]
	current_page: number
	per_page: number
	last_page: number
	total: number
}

/** Consume el listado genérico paginado del backend: `/list/:resource`. */
export const listService = {
	async getAll<T>(resource: string, params: ListParams = {}): Promise<PaginatedResponse<T>> {
		const query: Record<string, string | number> = {}

		if (params.search) {
			query.search = params.search
		}
		if (params.page) {
			query.page = params.page
		}
		if (params.limit) {
			query.limit = params.limit
		}
		if (params.sortBy) {
			query.sortBy = params.sortBy
		}
		if (params.sortOrder) {
			query.sortOrder = params.sortOrder
		}
		if (params.filters && Object.keys(params.filters).length > 0) {
			query.filters = JSON.stringify(params.filters)
		}

		const response = await api.get<PaginatedResponse<T>>(`/list/${resource}`, { params: query })
		return response.data
	},

	async create<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
		const response = await api.post<T>(`/${endpoint}`, data)
		return response.data
	},

	async update<T>(
		endpoint: string,
		id: number | string,
		data: Record<string, unknown>,
	): Promise<T> {
		const response = await api.patch<T>(`/${endpoint}/${id}`, data)
		return response.data
	},

	async remove(endpoint: string, id: number | string): Promise<void> {
		await api.delete(`/${endpoint}/${id}`)
	},
}