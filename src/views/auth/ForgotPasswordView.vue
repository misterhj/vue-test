<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.services'

const router = useRouter()
const usernameOrEmail = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resetToken = ref('')

const handleSubmit = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  resetToken.value = ''

  try {
    const res = await authService.forgotPassword({
      usernameOrEmail: usernameOrEmail.value
    })

    successMessage.value = res.message

    if (res.resetToken) {
      resetToken.value = res.resetToken
    }
  } catch (err: unknown) {
    const e = err as { message?: string }
    errorMessage.value = e.message || 'No se pudo procesar la solicitud'
  } finally {
    loading.value = false
  }
}

const goToReset = () => {
  router.push({ name: 'reset-password', query: { token: resetToken.value } })
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Recuperar contraseña</h2>
      <p class="hint">Ingresá tu usuario o correo en formato <strong>usuario@comercio</strong>.</p>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      <div v-if="successMessage" class="success-msg">
        <p>{{ successMessage }}</p>
        <p v-if="resetToken" class="token-hint">
          (Entorno de prueba) Token para reset:
          <br />
          <code>{{ resetToken }}</code>
          <br />
          <button type="button" class="link-btn" @click="goToReset">Ir a restablecer contraseña</button>
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form" v-if="!successMessage">
        <div class="form-group">
          <label for="usernameOrEmail">Usuario o correo</label>
          <input
            id="usernameOrEmail"
            v-model="usernameOrEmail"
            type="text"
            placeholder="admin@default"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" :disabled="loading" class="btn-primary">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Enviando...' : 'Enviar enlace' }}</span>
        </button>
      </form>

      <p class="auth-footer">
        <router-link to="/login">Volver al login</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container { display: flex; justify-content: center; align-items: center; min-height: 80vh; }
.auth-card { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 420px; text-align: center; }
.auth-card h2 { margin-top: 0; margin-bottom: 16px; color: #2c3e50; }
.hint { font-size: 0.9rem; color: #4a5568; margin-bottom: 20px; }
.auth-form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.9rem; font-weight: 600; color: #4a5568; }
.form-group input { padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
.btn-primary { margin-top: 8px; padding: 12px; background-color: #007bff; color: #fff; border: none; border-radius: 6px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
.btn-primary:disabled { background-color: #80bdff; opacity: 0.8; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }
@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.error-msg { color: #e53e3e; background: #fed7d7; padding: 8px 12px; border-radius: 4px; font-size: 0.875rem; margin-bottom: 16px; }
.success-msg { color: #22543d; background: #c6f6d5; padding: 12px; border-radius: 4px; font-size: 0.875rem; margin-bottom: 16px; text-align: left; }
.token-hint { margin-top: 10px; word-break: break-all; }
.link-btn { margin-top: 8px; background: none; border: none; color: #3182ce; font-weight: 600; cursor: pointer; }
.auth-footer { margin-top: 20px; font-size: 0.9rem; }
.auth-footer a { color: #3182ce; text-decoration: none; font-weight: 600; }
.auth-footer a:hover { text-decoration: underline; }
</style>
