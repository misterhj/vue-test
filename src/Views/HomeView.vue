<script setup lang="ts">
import { ref, onMounted } from 'vue'

const token = ref<string | null>(null)

onMounted(() => {
  token.value = localStorage.getItem('auth_token')
})
</script>

<template>
  <div style="text-align: center; padding: 40px 20px;">
    <h1>¡Bienvenido a Product App!</h1>
    <p style="color: #666; font-size: 1.1rem; max-width: 600px; margin: 15px auto;">
      Sistema desacoplado desarrollado con Laravel 11 API (Sanctum) en el Backend y Vue 3 (Composition API + TypeScript) en el Frontend.
    </p>

    <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
      <router-link to="/products" style="padding: 10px 20px; background: #2c3e50; color: white; text-decoration: none; border-radius: 4px;">
        Ver Productos
      </router-link>

      <template v-if="!token">
        <router-link to="/login" style="padding: 10px 20px; border: 1px solid #2c3e50; color: #2c3e50; text-decoration: none; border-radius: 4px;">
          Iniciar Sesión
        </router-link>
        <router-link to="/register" style="padding: 10px 20px; border: 1px solid #2c3e50; color: #2c3e50; text-decoration: none; border-radius: 4px;">
          Registrarse
        </router-link>
      </template>
    </div>
  </div>
</template>