<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    uiStore.closeSidebar()
  },
)
</script>

<template>
  <!-- Layout con menú solo para usuarios autenticados -->
  <div v-if="authStore.isAuthenticated" class="app-shell" style="font-family: system-ui, sans-serif;">
    <div
      v-if="uiStore.sidebarOpen"
      class="sidebar-overlay"
      @click="uiStore.closeSidebar()"
    ></div>
    <Sidebar />
    <div class="app-main">
      <Navbar />
      <main class="app-content">
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

.app-shell {
  display: flex;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  min-width: 0;
}

.app-content {
  padding: 25px;
  flex: 1;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 767px) {
  .app-content {
    padding: 16px;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 999;
  }
}
</style>