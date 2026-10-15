import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(false)
  const sidebarCollapsed = ref(false)

  function toggleSidebar() {
    // Móvil: muestra/oculta el panel deslizante
    sidebarOpen.value = !sidebarOpen.value
    // Escritorio: oculta/muestra el menú lateral
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function closeSidebar() {
    sidebarOpen.value = false
  }

  return {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    closeSidebar,
  }
})