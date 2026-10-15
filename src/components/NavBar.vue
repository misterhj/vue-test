<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { authService } from '@/services/auth.services'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
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

// Avatar dinámico con el nombre real del usuario
const avatarUrl = computed(() => {
  if (!authStore.user) return 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
  const name = encodeURIComponent(`${authStore.user.firstName} ${authStore.user.lastName}`)
  return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
})

const handleLogout = async () => {
  isDropdownOpen.value = false
  try {
    await authService.logout()
  } finally {
    authStore.logout() // 👈 Limpia el estado de Pinia y localStorage
    router.push('/login')
  }
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
    <div class="navbar-left">
      <button
        v-if="authStore.isAuthenticated"
        @click="uiStore.toggleSidebar()"
        class="hamburger"
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <span class="navbar-title">Panel de Control</span>
    </div>

    <div class="navbar-actions">
      <template v-if="authStore.isAuthenticated">
        <!-- Contenedor del Perfil con Dropdown -->
        <div class="user-menu-container">
          <button @click.stop="toggleDropdown" class="user-menu-btn">
            <img 
              :src="avatarUrl" 
              :alt="authStore.user?.firstName" 
              class="user-avatar-sm" 
            />
            <span class="user-name">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </span>
          </button>

          <!-- Menú desplegable -->
          <div v-if="isDropdownOpen" class="user-dropdown-card">
            <div class="dropdown-header">
              <img 
                :src="avatarUrl" 
                :alt="authStore.user?.firstName" 
                class="user-avatar-lg" 
              />
              <p class="dropdown-user-fullname">
                {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
              </p>
              <small class="dropdown-user-role">@{{ authStore.user?.username }}</small>
            </div>

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

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 34px;
  height: 34px;
  padding: 7px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.hamburger span {
  display: block;
  height: 2px;
  width: 100%;
  background: #333;
  border-radius: 2px;
}

@media (max-width: 767px) {
  .hamburger {
    display: flex;
  }

  .navbar-header {
    padding: 12px 16px;
  }
}

.navbar-title {
  font-weight: bold;
  color: #333;
}

.navbar-actions {
  display: flex;
  align-items: center;
}

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