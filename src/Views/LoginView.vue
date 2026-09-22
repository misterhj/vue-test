<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('admin@example.com')
const password = ref('password123')
const errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  try {
    const res = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await res.json()

    if(!res.ok) {
      errorMsg.value = data.message || 'Login failed'
      return
    }

    localStorage.auth_token = data.token
    router.push('/products')

  } catch (err) {
    console.error('Error during login:', err)
    errorMsg.value = 'Error de conexión con el servidor'
  }
}
</script>

<template>
  <div style="max-width: 400px; margin: 40px auto; font-family: system-ui, sans-serif;">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" placeholder="Email" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" placeholder="Password" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required />
      </div>
      <button type="submit" style="padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Login</button>
    </form>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p style="margin-top: 15px;">
        ¿No tienes cuenta? <router-link to="/register">Registrate aquí</router-link>
    </p>
  </div>
</template>