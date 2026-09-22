<script setup lang="ts">
import { ref, onMounted } from 'vue'

const token = ref<string | null>(null)

onMounted(() => {
  token.value = localStorage.getItem('auth_token')
})
</script>

<template>
  <aside style="width: 220px; background: #2c3e50; color: white; min-height: 100vh; padding: 20px; box-sizing: border-box;">
    <h3 style="margin-top: 0; color: #42b983;">Product App</h3>
    <nav style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
      <router-link to="/" class="nav-item">Inicio</router-link>
      <router-link to="/products" class="nav-item">Productos</router-link>
      
      <template v-if="!token">
        <router-link to="/login" class="nav-item">Login</router-link>
        <router-link to="/register" class="nav-item">Registro</router-link>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.nav-item {
  color: #ecf0f1;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}
.nav-item:hover, .router-link-active {
  background: #34495e;
  color: #42b983;
}
</style>