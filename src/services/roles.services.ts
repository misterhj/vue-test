import api from './api'

export interface Permission {
  id: number
  slug: string
  description?: string
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions: Permission[]
}

export interface CreateRoleDto {
  name: string
  description?: string
  permissionIds: number[]
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export const roleService = {
  async getAll(): Promise<Role[]> {
    const response = await api.get<Role[]>('/roles')
    return response.data
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await api.get<Permission[]>('/permissions')
    return response.data
  },

  async create(data: CreateRoleDto): Promise<Role> {
    const response = await api.post<Role>('/roles', data)
    return response.data
  },

  async update(id: number, data: UpdateRoleDto): Promise<Role> {
    const response = await api.patch<Role>(`/roles/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/roles/${id}`)
  }
}