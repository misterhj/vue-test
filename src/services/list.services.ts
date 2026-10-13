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

/** Consume el listado genérico paginado del backend: `POST /list/:resource`. */
export const listService = {
	async getAll<T>(resource: string, params: ListParams = {}): Promise<PaginatedResponse<T>> {
		const body: Record<string, unknown> = {}

		if (params.search) {
			body.search = params.search
		}
		if (params.page) {
			body.page = params.page
		}
		if (params.limit) {
			body.limit = params.limit
		}
		if (params.sortBy) {
			body.sortBy = params.sortBy
		}
		if (params.sortOrder) {
			body.sortOrder = params.sortOrder
		}
		if (params.filters && Object.keys(params.filters).length > 0) {
			body.filters = params.filters
		}

		const response = await api.post<PaginatedResponse<T>>(`/list/${resource}`, body)
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

export interface OptionItem {
	value: string | number
	label: string
}

const optionCache = new Map<string, OptionItem[]>()
const optionPending = new Map<string, Promise<OptionItem[]>>()

/** Limpia la caché de opciones (llamar tras crear/editar/eliminar). */
export function clearOptionsCache(): void {
	optionCache.clear()
	optionPending.clear()
}

/**
 * Carga las opciones de un recurso (`/list/:resource`) con caché en memoria y
 * deduplicación de peticiones concurrentes, para evitar ráfagas al backend.
 */
export function getOptions(resource: string, optionLabel = 'name'): Promise<OptionItem[]> {
	const labelKey = optionLabel || 'name'
	const cacheKey = `${resource}:${labelKey}`

	const cached = optionCache.get(cacheKey)
	if (cached) {
		return Promise.resolve(cached)
	}

	const pending = optionPending.get(cacheKey)
	if (pending) {
		return pending
	}

	const request = listService
		.getAll<Record<string, unknown>>(resource, { limit: 100 })
		.then((res) => {
			const items = res.data.map((row) => ({
				value: (row.id as string | number) ?? '',
				label: String(row[labelKey] ?? row.name ?? row.id ?? ''),
			}))
			optionCache.set(cacheKey, items)
			return items
		})
		.finally(() => {
			optionPending.delete(cacheKey)
		})

	optionPending.set(cacheKey, request)
	return request
}