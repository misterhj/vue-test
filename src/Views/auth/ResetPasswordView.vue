<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/services/auth.services'

const route = useRoute()
const router = useRouter()
const token = ref<string>(typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

onMounted(() => {
  if (!token.value) {
    errorMessage.value = 'Falta el token de restablecimiento'
  }
})

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!token.value) {
    errorMessage.value = 'Falta el token de restablecimiento'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  loading.value = true
  try {
    const res = await authService.resetPassword({
      token: token.value,
      password: password.value
    })
    successMessage.value = res.message
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string }
    errorMessage.value = e.response?.data?.message || e.message || 'No se pudo restablecer la contraseña'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Restablecer contraseña</h2>

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success-msg">{{ successMessage }} Redirigiendo al login...</p>

      <form @submit.prevent="handleSubmit" class="auth-form" v-if="!successMessage">
        <div class="form-group">
          <label for="password">Nueva contraseña</label>
          <input id="password" v-model="password" type="password" placeholder="••••••••" required :disabled="loading" minlength="8" />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar contraseña</label>
          <input id="confirmPassword" v-model="confirmPassword" type="password" placeholder="••••••••" required :disabled="loading" minlength="8" />
        </div>

        <button type="submit" :disabled="loading || !token" class="btn-primary">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Restableciendo...' : 'Restablecer contraseña' }}</span>
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
.auth-card h2 { margin-top: 0; margin-bottom: 24px; color: #2c3e50; }
.auth-form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.9rem; font-weight: 600; color: #4a5568; }
.form-group input { padding: 10px 12px; border: 1px solid #cbd5e0; border-radius: 6px; font-size: 0.95rem; width: 100%; box-sizing: border-box; }
.btn-primary { margin-top: 8px; padding: 12px; background-color: #007bff; color: #fff; border: none; border-radius: 6px; font-size: 1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
.btn-primary:disabled { background-color: #80bdff; opacity: 0.8; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite; }
@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.error-msg { color: #e53e3e; background: #fed7d7; padding: 8px 12px; border-radius: 4px; font-size: 0.875rem; margin-bottom: 16px; }
.success-msg { color: #22543d; background: #c6f6d5; padding: 8px 12px; border-radius: 4px; font-size: 0.875rem; margin-bottom: 16px; }
.auth-footer { margin-top: 20px; font-size: 0.9rem; }
.auth-footer a { color: #3182ce; text-decoration: none; font-weight: 600; }
.auth-footer a:hover { text-decoration: underline; }
</style>
