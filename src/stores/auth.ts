import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, AuthResponse } from '@/services/auth.services'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<Omit<User, 'permissions'> | null>(
    JSON.parse(localStorage.getItem('auth_user') || 'null')
  )
  const permissions = ref<string[]>(
    JSON.parse(localStorage.getItem('auth_permissions') || '[]')
  )

  const isAuthenticated = computed(() => !!token.value)

  function setSession(data: AuthResponse) {
    token.value = data.access_token
    
    // Separar permisos de la información del usuario
    const { permissions: userPerms, ...userProfile } = data.user

    user.value = userProfile
    permissions.value = userPerms || []

    // Persistencia estandarizada
    localStorage.setItem('auth_token', data.access_token)
    if (data.refresh_token) {
      localStorage.setItem('auth_refresh_token', data.refresh_token)
    }
    localStorage.setItem('auth_user', JSON.stringify(userProfile))
    localStorage.setItem('auth_permissions', JSON.stringify(permissions.value))
  }

  function hasPermission(permissionSlug: string): boolean {
    return permissions.value.includes(permissionSlug)
  }

  function logout() {
    token.value = null
    user.value = null
    permissions.value = []

    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_permissions')
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    setSession,
    hasPermission,
    logout,
  }
})