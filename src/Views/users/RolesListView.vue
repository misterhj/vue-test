<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { roleService, type Role, type Permission } from '@/services/roles.services'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])
const loading = ref(false)

const isModalOpen = ref(false)
const isEditing = ref(false)
const currentRoleId = ref<number | null>(null)

const form = ref({
  name: '',
  description: '',
  permissionIds: [] as number[]
})

const fetchData = async () => {
  loading.value = true
  try {
    const [rolesData, permsData] = await Promise.all([
      roleService.getAll(),
      roleService.getPermissions()
    ])
    roles.value = rolesData
    permissions.value = permsData
  } catch (err) {
    console.error('Error al cargar datos de roles:', err)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  currentRoleId.value = null
  form.value = { name: '', description: '', permissionIds: [] }
  isModalOpen.value = true
}

const openEditModal = (role: Role) => {
  isEditing.value = true
  currentRoleId.value = role.id
  form.value = {
    name: role.name,
    description: role.description || '',
    permissionIds: role.permissions ? role.permissions.map((p) => p.id) : []
  }
  isModalOpen.value = true
}

const togglePermission = (permId: number) => {
  const index = form.value.permissionIds.indexOf(permId)
  if (index === -1) form.value.permissionIds.push(permId)
  else form.value.permissionIds.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.name.trim()) return

  try {
    if (isEditing.value && currentRoleId.value) {
      await roleService.update(currentRoleId.value, form.value)
    } else {
      await roleService.create(form.value)
    }
    isModalOpen.value = false
    fetchData()
  } catch (err) {
    console.error('Error al guardar el rol:', err)
  }
}

const deleteRole = async (id: number) => {
  if (!confirm('¿Seguro que deseas eliminar este rol?')) return
  try {
    await roleService.delete(id)
    fetchData()
  } catch (err) {
    console.error('Error al eliminar el rol:', err)
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>Listado de Roles y Permisos</h1>
      <button 
        v-if="authStore.hasPermission('roles:create')" 
        @click="openCreateModal" 
        class="btn-primary"
      >
        Crear Nuevo Rol
      </button>
    </div>

    <div v-if="loading">Cargando roles...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre del Rol</th>
          <th>Descripción</th>
          <th>Permisos Asociados</th>
          <th v-if="authStore.hasPermission('roles:update') || authStore.hasPermission('roles:delete')">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="role in roles" :key="role.id">
          <td>{{ role.id }}</td>
          <td><strong>{{ role.name }}</strong></td>
          <td>{{ role.description || '-' }}</td>
          <td>
            <span v-for="p in role.permissions" :key="p.id" class="badge">
              {{ p.slug }}
            </span>
          </td>
          <td v-if="authStore.hasPermission('roles:update') || authStore.hasPermission('roles:delete')">
            <button v-if="authStore.hasPermission('roles:update')" @click="openEditModal(role)">Editar</button>
            <button v-if="authStore.hasPermission('roles:delete')" @click="deleteRole(role.id)" class="btn-danger">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Formulario de Rol -->
    <div v-if="isModalOpen" class="modal-backdrop">
      <div class="modal-card">
        <h2>{{ isEditing ? 'Editar Rol' : 'Nuevo Rol' }}</h2>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Nombre del Rol</label>
            <input type="text" v-model="form.name" required placeholder="ej. ADMIN" />
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <input type="text" v-model="form.description" placeholder="Descripción del rol" />
          </div>

          <div class="form-group">
            <label>Permisos Asociados</label>
            <div class="permissions-grid">
              <label v-for="perm in permissions" :key="perm.id" class="checkbox-item">
                <input
                  type="checkbox"
                  :checked="form.permissionIds.includes(perm.id)"
                  @change="togglePermission(perm.id)"
                />
                <span><strong>{{ perm.slug }}</strong> - {{ perm.description }}</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="isModalOpen = false">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { 
    padding: 20px;
}
.header { 
    display: flex;
    justify-content: space-between;
    align-items: center; 
    margin-bottom: 20px; 
}
.data-table { 
    width: 100%; 
    border-collapse: collapse; 
}
.data-table th, .data-table td { 
    border: 1px solid #ddd; 
    padding: 10px; 
    text-align: left; 
}
.badge { 
    display: inline-block; 
    background: #e0f2fe; 
    color: #0369a1; 
    padding: 2px 6px; 
    border-radius: 4px; 
    font-size: 0.8rem; 
    margin: 2px; 
}
.btn-primary { 
    background: #0284c7; 
    color: white; 
    border: none; 
    padding: 8px 16px; 
    border-radius: 4px; 
    cursor: pointer; 
}
.btn-danger { 
    background: #ef4444; 
    color: white; 
    border: none; 
    padding: 4px 8px; 
    border-radius: 4px; 
    cursor: pointer; 
    margin-left: 5px; 
}
.modal-backdrop { 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100vw; 
    height: 100vh; 
    background: rgba(0,0,0,0.5); 
    display: flex; 
    justify-content: center; 
    align-items: center; 
}
.modal-card {
    background: white;
    padding: 24px;
    border-radius: 8px; 
    width: 500px; 
    max-width: 90%; 
    max-height: 85vh; 
    overflow-y: auto; 
}
.form-group {
    margin-bottom: 15px; 
    display: flex; 
    flex-direction: column; 
    gap: 5px; 
}
.permissions-grid {
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
    max-height: 200px; 
    overflow-y: auto; 
    border: 1px solid #ddd; 
    padding: 10px; 
    border-radius: 4px; 
}
.checkbox-item {
    display: flex; 
    align-items: center; 
    gap: 8px; 
    font-size: 0.9rem; 
}
.modal-actions {
    display: flex; 
    justify-content: flex-end; 
    gap: 10px; 
    margin-top: 20px; 
}
</style>