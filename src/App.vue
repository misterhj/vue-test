<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/NavBar.vue'
import { isAuthenticated } from '@/services/auth.services'
</script>

<template>
  <!-- Layout con menú solo para usuarios autenticados -->
  <div v-if="isAuthenticated" style="display: flex; min-height: 100vh; font-family: system-ui, sans-serif;">
    <Sidebar />
    <div style="flex: 1; display: flex; flex-direction: column; background: #f8f9fa;">
      <Navbar />
      <main style="padding: 25px; flex: 1;">
        <router-view />
      </main>
    </div>
  </div>

  <!-- Layout sin menú para usuarios NO autenticados (Login / Registro) -->
  <div v-else style="min-height: 100vh; font-family: system-ui, sans-serif; background: #f8f9fa;">
    <main style="padding: 25px;">
      <router-view />
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>