<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
        password_confirmation: passwordConfirmation.value // <--- Campo requerido por Laravel
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar usuario')
    }

    localStorage.setItem('auth_token', data.access_token)
    router.push('/')
  } catch (err: any) {
    errorMessage.value = err.message
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

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <!-- Campo de Confirmación de Contraseña -->
        <div class="form-group">
          <label for="password_confirmation">Confirmar Contraseña</label>
          <input
            id="password_confirmation"
            v-model="passwordConfirmation"
            type="password"
            placeholder="••••••••"
            required
          />
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
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 380px;
  text-align: center;
}

.auth-card h2 {
  margin-top: 0;
  margin-bottom: 24px;
  color: #2c3e50;
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

.form-group input {
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #28a745;
}

.btn-success {
  margin-top: 8px;
  padding: 12px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
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
  border-radius: 4px;
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