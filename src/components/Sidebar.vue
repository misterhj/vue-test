<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const authStore = useAuthStore()
const uiStore = useUiStore()
const isUsersMenuOpen = ref(false)
const isProductsMenuOpen = ref(false)
const isReportsMenuOpen = ref(false)

const toggleUsersMenu = () => {
  isUsersMenuOpen.value = !isUsersMenuOpen.value
}

const toggleProductsMenu = () => {
  isProductsMenuOpen.value = !isProductsMenuOpen.value
}

const toggleReportsMenu = () => {
  isReportsMenuOpen.value = !isReportsMenuOpen.value
}

const navigate = () => {
  uiStore.closeSidebar()
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': uiStore.sidebarOpen }">
    <h3 class="sidebar-brand">Product App</h3>
    
    <nav class="sidebar-nav">
      <!-- Enlace Inicio -->
      <router-link to="/" class="nav-item" @click="navigate">Inicio</router-link>

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
            @click="navigate"
          >
            Productos
          </router-link>

          <router-link
            v-if="authStore.hasPermission('brands:read') || authStore.hasPermission('models:read')"
            to="/products/brands-models"
            class="submenu-item"
            @click="navigate"
          >
            Marcas y Modelos
          </router-link>

          <router-link
            v-if="authStore.hasPermission('sections:read')"
            to="/products/sections"
            class="submenu-item"
            @click="navigate"
          >
            Secciones
          </router-link>

          <router-link
            v-if="authStore.hasPermission('categories:read')"
            to="/products/categories-subcategories"
            class="submenu-item"
            @click="navigate"
          >
            Categorías y Subcategorías
          </router-link>
        </div>
      </div>

      <!-- Clientes -->
      <router-link
        v-if="authStore.isAuthenticated && authStore.hasPermission('customers:read')"
        to="/customers"
        class="nav-item"
        @click="navigate"
      >
        Clientes
      </router-link>

      <!-- Compras -->
      <router-link
        v-if="authStore.isAuthenticated && authStore.hasPermission('purchases:read')"
        to="/purchases"
        class="nav-item"
        @click="navigate"
      >
        Compras
      </router-link>

      <!-- Ventas -->
      <router-link
        v-if="authStore.isAuthenticated && authStore.hasPermission('sales:read')"
        to="/sales"
        class="nav-item"
        @click="navigate"
      >
        Ventas
      </router-link>

      <!-- Inventario -->
      <router-link
        v-if="authStore.isAuthenticated && authStore.hasPermission('inventory:read')"
        to="/inventory"
        class="nav-item"
        @click="navigate"
      >
        Inventario
      </router-link>

      <!-- Pagos y Cobros -->
      <router-link
        v-if="authStore.isAuthenticated && authStore.hasPermission('payments:read')"
        to="/payments"
        class="nav-item"
        @click="navigate"
      >
        Pagos y Cobros
      </router-link>

      <!-- Reportes -->
      <div v-if="authStore.isAuthenticated && authStore.hasPermission('reports:read')">
        <button @click="toggleReportsMenu" class="nav-item nav-parent-btn">
          <span>Reportes</span>
          <span class="arrow">{{ isReportsMenuOpen ? '▼' : '▶' }}</span>
        </button>
        <transition name="fade">
          <ul v-if="isReportsMenuOpen" class="menu-sub">
            <li>
              <router-link to="/reports/sales">
                <i class="bi bi-bar-chart"></i>
                <span class="menu-text">Ventas por período</span>
              </router-link>
            </li>
            <li>
              <router-link to="/reports/stock-valuation">
                <i class="bi bi-box-seam"></i>
                <span class="menu-text">Stock valorizado</span>
              </router-link>
            </li>
            <li>
              <router-link to="/reports/receivables">
                <i class="bi bi-clock-history"></i>
                <span class="menu-text">Cuentas por cobrar</span>
              </router-link>
            </li>
            <li>
              <router-link to="/reports/payables">
                <i class="bi bi-receipt"></i>
                <span class="menu-text">Cuentas por pagar</span>
              </router-link>
            </li>
          </ul>
        </transition>
      </div>

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
            @click="navigate"
          >
            Lista de Usuarios
          </router-link>

          <router-link 
            v-if="authStore.hasPermission('roles:read')" 
            to="/users/roles" 
            class="submenu-item"
            @click="navigate"
          >
            Roles y Permisos
          </router-link>
        </div>
      </div>

      <!-- Login para invitados -->
      <template v-if="!authStore.isAuthenticated">
        <router-link to="/login" class="nav-item" @click="navigate">Login</router-link>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px; 
  background: #2c3e50; 
  color: white; 
  height: 100vh; 
  overflow-y: auto;
  padding: 20px 15px; 
  box-sizing: border-box;
  flex-shrink: 0;
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

@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1001;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    overflow-y: auto;
  }

  .sidebar--open {
    transform: translateX(0);
  }
}
</style>