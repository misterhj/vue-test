<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userManagementService, type UserManagement } from '@/services/user-management.services'
import { roleService, type Role, type Permission } from '@/services/roles.services'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const users = ref<UserManagement[]>([])
const availableRoles = ref<Role[]>([])
const availablePermissions = ref<Permission[]>([])
const loading = ref(false)

const isModalOpen = ref(false)
const selectedUser = ref<UserManagement | null>(null)
const selectedRoleIds = ref<number[]>([])
const selectedDirectPermissionIds = ref<number[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const [usersData, rolesData, permsData] = await Promise.all([
      userManagementService.getAll(),
      roleService.getAll(),
      roleService.getPermissions()
    ])
    users.value = usersData
    availableRoles.value = rolesData
    availablePermissions.value = permsData
  } catch (err) {
    console.error('Error al cargar datos de usuarios:', err)
  } finally {
    loading.value = false
  }
}

const openManageModal = (user: UserManagement) => {
  selectedUser.value = user
  selectedRoleIds.value = user.roles ? user.roles.map((r) => r.id) : []
  selectedDirectPermissionIds.value = user.directPermissions ? user.directPermissions.map((p) => p.id) : []
  isModalOpen.value = true
}

const toggleRole = (roleId: number) => {
  const index = selectedRoleIds.value.indexOf(roleId)
  if (index === -1) selectedRoleIds.value.push(roleId)
  else selectedRoleIds.value.splice(index, 1)
}

const toggleDirectPermission = (permId: number) => {
  const index = selectedDirectPermissionIds.value.indexOf(permId)
  if (index === -1) selectedDirectPermissionIds.value.push(permId)
  else selectedDirectPermissionIds.value.splice(index, 1)
}

const handleSaveAccess = async () => {
  if (!selectedUser.value) return

  try {
    await userManagementService.assignAccess(selectedUser.value.id, {
      roleIds: selectedRoleIds.value,
      directPermissionIds: selectedDirectPermissionIds.value
    })
    isModalOpen.value = false
    loadData()
  } catch (err) {
    console.error('Error al actualizar rol y permisos:', err)
  }
}

onMounted(() => loadData())
</script>

<template>
  <div class="container">
    <h1>Listado de Usuarios</h1>

    <div v-if="loading">Cargando usuarios...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Usuario / Email</th>
          <th>Roles Asignados</th>
          <th>Permisos Directos</th>
          <th v-if="authStore.hasPermission('users:manage')">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.firstName }} {{ u.lastName }}</td>
          <td>@{{ u.username }} <br /><small>{{ u.email }}</small></td>
          <td>
            <span v-for="r in u.roles" :key="r.id" class="badge badge-role">{{ r.name }}</span>
          </td>
          <td>
            <span v-for="p in u.directPermissions" :key="p.id" class="badge badge-perm">{{ p.slug }}</span>
          </td>
          <td v-if="authStore.hasPermission('users:manage')">
            <button @click="openManageModal(u)">Gestionar Rol y Permisos</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para Gestionar Rol y Permisos del Usuario -->
    <div v-if="isModalOpen && selectedUser" class="modal-backdrop">
      <div class="modal-card">
        <h2>Gestionar Acceso - {{ selectedUser.firstName }} {{ selectedUser.lastName }}</h2>

        <div class="section">
          <h3>Asignar Roles</h3>
          <div class="checkbox-list">
            <label v-for="role in availableRoles" :key="role.id" class="checkbox-item">
              <input
                type="checkbox"
                :checked="selectedRoleIds.includes(role.id)"
                @change="toggleRole(role.id)"
              />
              <span><strong>{{ role.name }}</strong> - {{ role.description }}</span>
            </label>
          </div>
        </div>

        <div class="section">
          <h3>Asignar Permisos Directos</h3>
          <div class="checkbox-list">
            <label v-for="perm in availablePermissions" :key="perm.id" class="checkbox-item">
              <input
                type="checkbox"
                :checked="selectedDirectPermissionIds.includes(perm.id)"
                @change="toggleDirectPermission(perm.id)"
              />
              <span><strong>{{ perm.slug }}</strong> - {{ perm.description }}</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="isModalOpen = false">Cancelar</button>
          <button type="button" @click="handleSaveAccess" class="btn-primary">Guardar Cambios</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { 
    padding: 20px; 
}
.data-table { 
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}
.data-table th, .data-table td { 
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
}
.badge { 
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin: 2px;
}
.badge-role {
    background: #fef3c7;
    color: #92400e;
}
.badge-perm { 
    background: #e0e7ff;
    color: #3730a3;
}
.btn-primary { 
    background: #0284c7;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
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
    width: 520px;
    max-width: 90%;
    max-height: 85vh;
    overflow-y: auto;
}
.checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 160px;
    overflow-y: auto;
    border: 1px solid #eee;
    padding: 10px;
    border-radius: 4px;
}
.checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}
.section { 
    margin-bottom: 20px;
}
.modal-actions { 
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>