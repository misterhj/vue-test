<script setup>
import { ref, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const token = ref(localStorage.auth_token)

watchEffect(() => {
  token.value = localStorage.auth_token
})

const handleLogout = () => {
  localStorage.removeItem('auth_token')
  token.value = null
  router.push('/login')
}
</script>

<template>
  <div style="max-width: 800px; margin: 40px auto; font-family: system-ui, sans-serif; padding: 0 20px;">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
      <h2>Product App</h2>
      <nav style="display: flex; gap: 15px; align-items: center;">
        <router-link to="/">Productos</router-link>
        <template v-if="!token">
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Registro</router-link>
        </template>
        <button v-else @click="handleLogout" style="padding: 5px 10px;">Cerrar Sesión</button>
      </nav>
    </header>

    <!-- Renderizado dinámico de la ruta activa -->
    <router-view />
  </div>
</template>