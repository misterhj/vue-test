<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.services'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)
const errorMessage = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
	const data = await authService.register({
		name: name.value,
		email: email.value,
		password: password.value
	})

    router.push('/')
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

      <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Nombre completo"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <!-- Campo Contraseña -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="toggle-btn"
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              <!-- Ícono Ojo Cerrado (Ocultar) -->
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <!-- Ícono Ojo Abierto (Mostrar) -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <!-- Campo Confirmación de Contraseña -->
        <div class="form-group">
          <label for="password_confirmation">Confirmar Contraseña</label>
          <div class="input-wrapper">
            <input
              id="password_confirmation"
              v-model="passwordConfirmation"
              :type="showPasswordConfirmation ? 'text' : 'password'"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="toggle-btn"
              @click="showPasswordConfirmation = !showPasswordConfirmation"
              :title="showPasswordConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              <!-- Ícono Ojo Cerrado (Ocultar) -->
              <svg v-if="showPasswordConfirmation" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <!-- Ícono Ojo Abierto (Mostrar) -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="btn-success">
          {{ loading ? 'Registrando...' : 'Register' }}
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
  min-height: 80vh;
}

.auth-card {
  background: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 380px;
  text-align: center;
}

.auth-card h2 {
  margin-top: 0;
  margin-bottom: 24px;
  color: #1a2533;
  font-weight: 700;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
}

/* Aplicar estilos unificados a todos los inputs */
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.15);
}

/* Contenedor relativo para posicionar el ícono del ojo */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-wrapper input {
  padding-right: 40px; /* Espacio para que el texto no choque con el ojo */
}

.toggle-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  padding: 4px;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #1a2533;
}

.btn-success {
  margin-top: 8px;
  padding: 12px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-success:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.error-msg {
  color: #e53e3e;
  background: #fed7d7;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.auth-footer {
  margin-top: 20px;
  font-size: 0.9rem;
  color: #718096;
}

.auth-footer a {
  color: #28a745;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>