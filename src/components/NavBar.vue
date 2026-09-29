<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authService, isAuthenticated } from '@/services/auth.services'

const router = useRouter()

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}
</script>

<template>
  <header style="background: #ffffff; border-bottom: 1px solid #e0e0e0; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-weight: bold; color: #333;">Panel de Control</span>
    <div>
      <template v-if="isAuthenticated">
        <span style="margin-right: 15px; color: green; font-size: 0.9rem;">● Sesión Activa</span>
        <button @click="handleLogout" style="padding: 6px 12px; cursor: pointer; background: #e74c3c; color: white; border: none; border-radius: 4px;">
          Cerrar Sesión
        </button>
      </template>
      <template v-else>
        <router-link to="/login" style="margin-right: 10px; text-decoration: none; color: #2c3e50;">Ingresar</router-link>
      </template>
    </div>
  </header>
</template>