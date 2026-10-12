<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isUsersMenuOpen = ref(false)
const isProductsMenuOpen = ref(false)

const toggleUsersMenu = () => {
  isUsersMenuOpen.value = !isUsersMenuOpen.value
}

const toggleProductsMenu = () => {
  isProductsMenuOpen.value = !isProductsMenuOpen.value
}
</script>

<template>
  <aside class="sidebar">
    <h3 class="sidebar-brand">Product App</h3>
    
    <nav class="sidebar-nav">
      <!-- Enlace Inicio -->
      <router-link to="/" class="nav-item">Inicio</router-link>

      <!-- Módulo Productos (Menú Padre Desplegable) -->
      <div v-if="authStore.isAuthenticated && (
        authStore.hasPermission('products:read') ||
        authStore.hasPermission('brands:read') ||
        authStore.hasPermission('sections:read') ||
        authStore.hasPermission('categories:read') ||
        authStore.hasPermission('models:read')
      )">
        <button @click="toggleProductsMenu" class="nav-item nav-parent-btn">
          <span>Productos</span>
          <span class="arrow">{{ isProductsMenuOpen ? '▼' : '▶' }}</span>
        </button>

        <!-- Submenú -->
        <div v-if="isProductsMenuOpen" class="submenu">
          <router-link
            v-if="authStore.hasPermission('products:read')"
            to="/products"
            class="submenu-item"
          >
            Productos
          </router-link>

          <router-link
            v-if="authStore.hasPermission('brands:read')"
            to="/products/brands"
            class="submenu-item"
          >
            Marcas
          </router-link>

          <router-link
            v-if="authStore.hasPermission('sections:read')"
            to="/products/sections"
            class="submenu-item"
          >
            Secciones
          </router-link>

          <router-link
            v-if="authStore.hasPermission('categories:read')"
            to="/products/categories"
            class="submenu-item"
          >
            Categorías
          </router-link>

          <router-link
            v-if="authStore.hasPermission('categories:read')"
            to="/products/subcategories"
            class="submenu-item"
          >
            Subcategorías
          </router-link>

          <router-link
            v-if="authStore.hasPermission('models:read')"
            to="/products/models"
            class="submenu-item"
          >
            Modelos
          </router-link>
        </div>
      </div>

      <!-- Clientes -->
      <router-link
        v-if="authStore.isAuthenticated && authStore.hasPermission('customers:read')"
        to="/customers"
        class="nav-item"
      >
        Clientes
      </router-link>

      <!-- Módulo Usuarios (Menú Padre Desplegable) -->
      <div v-if="authStore.isAuthenticated && (authStore.hasPermission('users:read') || authStore.hasPermission('roles:read'))">
        <button @click="toggleUsersMenu" class="nav-item nav-parent-btn">
          <span>Usuarios</span>
          <span class="arrow">{{ isUsersMenuOpen ? '▼' : '▶' }}</span>
        </button>

        <!-- Submenú -->
        <div v-if="isUsersMenuOpen" class="submenu">
          <router-link 
            v-if="authStore.hasPermission('users:read')" 
            to="/users" 
            class="submenu-item"
          >
            Lista de Usuarios
          </router-link>

          <router-link 
            v-if="authStore.hasPermission('roles:read')" 
            to="/users/roles" 
            class="submenu-item"
          >
            Roles y Permisos
          </router-link>
        </div>
      </div>

      <!-- Login para invitados -->
      <template v-if="!authStore.isAuthenticated">
        <router-link to="/login" class="nav-item">Login</router-link>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px; 
  background: #2c3e50; 
  color: white; 
  min-height: 100vh; 
  padding: 20px 15px; 
  box-sizing: border-box;
}

.sidebar-brand {
  margin-top: 0; 
  color: #42b983;
}

.sidebar-nav {
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  margin-top: 20px;
}

.nav-item {
  color: #ecf0f1;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.nav-parent-btn {
  width: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  text-align: left;
}

.nav-item:hover, 
.router-link-exact-active {
  background: #34495e;
  color: #42b983;
}

.arrow {
  font-size: 0.75rem;
}

/* Estilos del Submenú */
.submenu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 15px;
  margin-top: 4px;
}

.submenu-item {
  color: #bdc3c7;
  text-decoration: none;
  padding: 8px 12px;
  font-size: 0.9rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.submenu-item:hover,
.submenu-item.router-link-exact-active {
  background: #1a252f;
  color: #42b983;
}
</style>