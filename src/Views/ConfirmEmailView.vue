<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const loading = ref(true)
const successMessage = ref('')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    errorMessage.value = 'Token de confirmación no proporcionado.'
    loading.value = false
    return
  }

  try {
    const response = await api.get(`/auth/confirm-email?token=${token}`)
    successMessage.value = response.data.message || '¡Cuenta confirmada con éxito!'
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Error al confirmar la cuenta.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="confirm-container">
    <div class="confirm-card">
      <h2>Confirmación de Cuenta</h2>

      <div v-if="loading" class="loading">Confirmando tu cuenta...</div>

      <div v-else-if="successMessage" class="alert alert-success">
        <p>{{ successMessage }}</p>

        <router-link to="/login" class="btn-primary">Iniciar Sesión</router-link>
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">
        <p>{{ errorMessage }}</p>
        <router-link to="/register" class="btn-link">Volver al Registro</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}
.confirm-card {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 420px;
}
.btn-primary {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
}
</style>