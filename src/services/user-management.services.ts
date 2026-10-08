import api from './api'
import type { Role, Permission } from './roles.services'

export interface UserManagement {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string;
  roles: Role[]
  directPermissions: Permission[]
}

export interface AssignUserAccessDto {
  roleIds: number[]
  directPermissionIds: number[]
}

export const userManagementService = {
  async getAll(): Promise<UserManagement[]> {
    const response = await api.get<UserManagement[]>('/users')
    return response.data
  },

  async assignAccess(userId: number, data: AssignUserAccessDto): Promise<UserManagement> {
    const response = await api.patch<UserManagement>(`/users/${userId}/access`, data)
    return response.data
  }
}