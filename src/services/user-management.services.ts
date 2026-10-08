import api from './api'
import type { Role, Permission } from './roles.services'

export interface UserManagement {
  id: number
  firstName: string
  lastName: string
  username: string
  email: string;
  isActive?: boolean
  roles: Role[]
  directPermissions: Permission[]
}

export interface CreateUserByAdminDto {
  firstName: string
  lastName: string
  username: string
  email: string
  identityDocument?: string
  telephone?: string
  password: string
  roleIds?: number[]
  directPermissionIds?: number[]
  isActive?: boolean
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

	async createByAdmin(data: CreateUserByAdminDto): Promise<UserManagement> {
    	const response = await api.post<UserManagement>('/users', data)
    	return response.data
  	},

  	async assignAccess(userId: number, data: AssignUserAccessDto): Promise<UserManagement> {
    	const response = await api.patch<UserManagement>(`/users/${userId}/access`, data)
    	return response.data
  	}
}