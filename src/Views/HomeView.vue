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

  </div>
</template>