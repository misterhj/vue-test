<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.services'

const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const username = ref('')
const email = ref('')
const identityDocument = ref('')
const telephone = ref('')
const password = ref('')
const passwordConfirmation = ref('')

const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true

  try {
    const response = await authService.register({
      firstName: firstName.value,
      lastName: lastName.value,
      username: username.value,
      email: email.value,
      identityDocument: identityDocument.value,
      telephone: telephone.value,
      password: password.value
    })

    successMessage.value = response.message || 'Te hemos enviado un correo de confirmación. Revisa tu bandeja de entrada.'
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || err.message || 'Error al registrar usuario'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Crear Cuenta</h2>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
        <p class="mt-2">
          <router-link to="/login" class="link-bold">Ir al Inicio de Sesión</router-link>
        </p>
      </div>

      <p v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</p>

      <form v-if="!successMessage" @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">Nombre *</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              placeholder="Juan"
              required
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label for="lastName">Apellido *</label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              placeholder="Pérez"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="username">Usuario *</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="juanperez"
              required
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label for="email">Correo Electrónico *</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="identityDocument">Documento (Opcional)</label>
            <input
              id="identityDocument"
              v-model="identityDocument"
              type="text"
              placeholder="Ej: 1234567"
              :disabled="loading"
            />
          </div>
          <div class="form-group">
            <label for="telephone">Teléfono (Opcional)</label>
            <input
              id="telephone"
              v-model="telephone"
              type="text"
              placeholder="Ej: +595981123456"
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password">Contraseña *</label>
            <div class="input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                :disabled="loading"
              />
              <button
                type="button"
                class="toggle-btn"
                @click="showPassword = !showPassword"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="password_confirmation">Confirmar Contraseña *</label>
            <div class="input-wrapper">
              <input
                id="password_confirmation"
                v-model="passwordConfirmation"
                :type="showPasswordConfirmation ? 'text' : 'password'"
                placeholder="••••••••"
                required
                :disabled="loading"
              />
              <button
                type="button"
                class="toggle-btn"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
              >
                <svg v-if="showPasswordConfirmation" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn-success">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? 'Registrando...' : 'Registrarse' }}</span>
        </button>
      </form>

      <p class="auth-footer">
        ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 85vh;
  padding: 1rem;
}

.auth-card {
  background: #ffffff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 580px;
}

.auth-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1a2533;
  font-weight: 700;
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a5568;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.15);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  padding-right: 36px;
}

.toggle-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #718096;
}

/* Botón Success */
.btn-success {
  margin-top: 10px;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  transition: background-color 0.2s;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
}

.btn-success:disabled {
  background-color: #71dd8c;
  cursor: not-allowed;
  opacity: 0.8;
}

/* Loader CSS Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert {
  padding: 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.alert-error {
  background: #fed7d7;
  color: #9b2c2c;
}

.alert-success {
  background: #c6f6d5;
  color: #22543d;
  text-align: center;
}

.auth-footer {
  margin-top: 16px;
  font-size: 0.9rem;
  color: #718096;
  text-align: center;
}

.auth-footer a, .link-bold {
  color: #28a745;
  text-decoration: none;
  font-weight: 600;
}
</style>