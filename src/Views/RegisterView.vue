<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const name = ref('')
const errorMsg = ref('')

const handleRegister = async () => {
  errorMsg.value = ''
  try {
    const res = await fetch('http://localhost:8000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value, name: name.value })
    })

    const data = await res.json()

    if(!res.ok) {
      errorMsg.value = data.message || 'Error al registrar usuario'
      return
    }

    localStorage.auth_token = data.access_token
    router.push('/products')

  } catch (err) {
    console.error('Error during registration:', err)
    errorMsg.value = 'Error de conexión con el servidor'
  }
}
</script>

<template>
  <div style="max-width: 400px; margin: 40px auto; font-family: system-ui, sans-serif;">
    <h1>Crear Cuenta</h1>
    <form @submit.prevent="handleRegister" style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label for="name">Name:</label>
        <input type="text" id="name" v-model="name" placeholder="Name" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required />
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" placeholder="Email" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required />
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" placeholder="Password" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;" required />
      </div>
      <button type="submit" style="padding: 8px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Register</button>
    </form>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p style="margin-top: 15px;">
        ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link>
    </p>
  </div>
</template>