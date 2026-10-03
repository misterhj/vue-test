<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService, isAuthenticated, currentUser } from '@/services/auth.services'

const router = useRouter()
const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = (event: MouseEvent) => {
	const target = event.target as HTMLElement
	if (!target.closest('.user-menu-container')) {
  		isDropdownOpen.value = false
	}
}

const handleLogout = async () => {
	isDropdownOpen.value = false
  	await authService.logout()
  	router.push('/login')
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

</script>

<template>
  <header class="navbar-header">
    <span class="navbar-title">Panel de Control</span>

    <div class="navbar-actions">
      <template v-if="isAuthenticated">
        <!-- Contenedor del Perfil con Dropdown -->
        <div class="user-menu-container">
          <button @click.stop="toggleDropdown" class="user-menu-btn">
            <img 
              src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" 
              :alt="currentUser?.firstName" 
              class="user-avatar-sm" 
            />
            <span class="user-name">
              {{ currentUser?.firstName }} {{ currentUser?.lastName }}
            </span>
          </button>

          <!-- Menú desplegable estilo AdminLTE -->
          <div v-if="isDropdownOpen" class="user-dropdown-card">
            <!-- Header con fondo azul y Avatar grande -->
            <div class="dropdown-header">
              <img 
                src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff" 
                :alt="currentUser?.firstName" 
                class="user-avatar-lg" 
              />
              <p class="dropdown-user-fullname">
                {{ currentUser?.firstName }} {{ currentUser?.lastName }}
              </p>
              <small class="dropdown-user-role">@{{ currentUser?.username }}</small>
            </div>

            <!-- Acciones del pie de tarjeta -->
            <div class="dropdown-footer">
              <router-link to="/profile" @click="isDropdownOpen = false" class="btn-profile">
                Perfil
              </router-link>
              <button @click="handleLogout" class="btn-logout">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <router-link to="/login" class="login-link">Ingresar</router-link>
      </template>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.navbar-title {
  font-weight: bold;
  color: #333;
}

.navbar-actions {
  display: flex;
  align-items: center;
}

/* Contenedor relativo para posicionar el dropdown */
.user-menu-container {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-menu-btn:hover {
  background: #f0f2f5;
}

.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

/* Tarjeta flotante Dropdown */
.user-dropdown-card {
  position: absolute;
  top: 120%;
  right: 0;
  width: 280px;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  border: 1px solid #e2e8f0;
}

.dropdown-header {
  background: #007bff;
  color: white;
  padding: 24px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
}

.dropdown-user-fullname {
  margin: 0;
  font-weight: bold;
  font-size: 1.1rem;
}

.dropdown-user-role {
  color: #e0e6ed;
  font-size: 0.85rem;
  margin-top: 4px;
}

.dropdown-footer {
  padding: 12px 16px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e9ecef;
}

.btn-profile {
  padding: 6px 16px;
  background: #ffffff;
  color: #495057;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-profile:hover {
  background: #e9ecef;
}

.btn-logout {
  padding: 6px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #c82333;
}

.login-link {
  text-decoration: none;
  color: #2c3e50;
  font-weight: 600;
}
</style>