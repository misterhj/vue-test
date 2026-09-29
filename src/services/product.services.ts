import api from './api'

export interface Product {
  id: number
  name: string
  price: number
  // Agrega más propiedades según la estructura de tu modelo (ej. price, description)
}

export interface ProductsResponse {
  data: Product[]
  current_page: number
  last_page: number
  total: number
}

export const productService = {
  async getAll(search: string = '', page: number = 1): Promise<ProductsResponse> {
    const response = await api.get<ProductsResponse>('/products', {
      params: { search, page }
    })
    return response.data
  },

  async create(data: { name: string }): Promise<Product> {
    const response = await api.post<Product>('/products', data)
    return response.data
  },

  async update(id: number, data: { name: string }): Promise<Product> {
    const response = await api.put<Product>(`/products/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/products/${id}`)
  }
}