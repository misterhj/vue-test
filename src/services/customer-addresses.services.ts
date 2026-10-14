import api from './api'

export type CustomerAddressType = 'shipping' | 'billing'

export interface CustomerAddress {
	id: number
	customerId: number
	type: CustomerAddressType
	line1: string
	line2: string | null
	city: string | null
	state: string | null
	postalCode: string | null
	country: string | null
	isDefault: boolean
	createdAt: string
	updatedAt: string
}

export interface CustomerAddressInput {
	type?: CustomerAddressType
	line1: string
	line2?: string
	city?: string
	state?: string
	postalCode?: string
	country?: string
	isDefault?: boolean
}

export const customerAddressService = {
	async list(customerId: number): Promise<CustomerAddress[]> {
		const response = await api.get<CustomerAddress[]>(
			`/customers/${customerId}/addresses`,
		)
		return response.data
	},

	async create(
		customerId: number,
		data: CustomerAddressInput,
	): Promise<CustomerAddress> {
		const response = await api.post<CustomerAddress>(
			`/customers/${customerId}/addresses`,
			data,
		)
		return response.data
	},

	async update(
		customerId: number,
		id: number,
		data: Partial<CustomerAddressInput>,
	): Promise<CustomerAddress> {
		const response = await api.patch<CustomerAddress>(
			`/customers/${customerId}/addresses/${id}`,
			data,
		)
		return response.data
	},

	async remove(customerId: number, id: number): Promise<void> {
		await api.delete(`/customers/${customerId}/addresses/${id}`)
	},
}
