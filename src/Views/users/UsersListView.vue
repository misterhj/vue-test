<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  userManagementService, 
  type UserManagement, 
  type CreateUserByAdminDto 
} from '@/services/user-management.services'
import { roleService, type Role, type Permission } from '@/services/roles.services'

const users = ref<UserManagement[]>([])
const availableRoles = ref<Role[]>([])
const availablePermissions = ref<Permission[]>([])
const isLoading = ref(false)

// Estado del Modal de Creación
const showCreateModal = ref(false)
const newUserForm = ref<CreateUserByAdminDto>({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  identityDocument: '',
  telephone: '',
  password: '',
  roleIds: [],
  isActive: true,
})

// Estado del Modal de Gestión de Accesos
const showAccessModal = ref(false)
const selectedUser = ref<UserManagement | null>(null)
const selectedRoleIds = ref<number[]>([])
const selectedDirectPermissionIds = ref<number[]>([])

const loadData = async () => {
  isLoading.value = true
  try {
    const [usersData, rolesData, permissionsData] = await Promise.all([
      userManagementService.getAll(),
      roleService.getAll(),
      roleService.getPermissions(),
    ])
    users.value = usersData
    availableRoles.value = rolesData
    availablePermissions.value = permissionsData
  } catch (error: any) {
    alert(error.message || 'Error al cargar los datos de usuarios')
  } finally {
    isLoading.value = false
  }
}

// Abrir Modal de Creación
const openCreateModal = () => {
  newUserForm.value = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    identityDocument: '',
    telephone: '',
    password: '',
    roleIds: [],
    isActive: true,
  }
  showCreateModal.value = true
}

// Guardar Nuevo Usuario (Admin)
const handleCreateUser = async () => {
  try {
    await userManagementService.createByAdmin(newUserForm.value)
    showCreateModal.value = false
    await loadData()
  } catch (error: any) {
    alert(error.message || 'Error al registrar el usuario')
  }
}

// Abrir Modal de Edición de Accesos
const openAccessModal = (user: UserManagement) => {
  selectedUser.value = user
  selectedRoleIds.value = user.roles ? user.roles.map((r) => r.id) : []
  selectedDirectPermissionIds.value = user.directPermissions
    ? user.directPermissions.map((p) => p.id)
    : []
  showAccessModal.value = true
}

// Guardar Asignación de Roles y Permisos Directos
const handleSaveAccess = async () => {
  if (!selectedUser.value) return
  try {
    await userManagementService.assignAccess(selectedUser.value.id, {
      roleIds: selectedRoleIds.value,
      directPermissionIds: selectedDirectPermissionIds.value,
    })
    showAccessModal.value = false
    await loadData()
  } catch (error: any) {
    alert(error.message || 'Error al guardar los accesos')
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="users-container">
    <div class="header">
      <h2>Gestión de Usuarios</h2>
      <button class="btn btn-primary" @click="openCreateModal">
        + Crear Usuario
      </button>
    </div>

    <div v-if="isLoading" class="loading">Cargando usuarios...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuario</th>
          <th>Nombre Completo</th>
          <th>Correo</th>
          <th>Roles</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td><b>@{{ user.username }}</b></td>
          <td>{{ user.firstName }} {{ user.lastName }}</td>
          <td>{{ user.email }}</td>
          <td>
            <span v-for="role in user.roles" :key="role.id" class="badge badge-role">
              {{ role.name }}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-secondary" @click="openAccessModal(user)">
              Asignar Accesos
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para Crear Usuario Admin -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Crear Usuario (Administración)</h3>
        <form @submit.prevent="handleCreateUser">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre *</label>
              <input v-model="newUserForm.firstName" required />
            </div>
            <div class="form-group">
              <label>Apellido *</label>
              <input v-model="newUserForm.lastName" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Nombre de Usuario *</label>
              <input v-model="newUserForm.username" required />
            </div>
            <div class="form-group">
              <label>Correo Electrónico *</label>
              <input v-model="newUserForm.email" type="email" required />
            </div>
          </div>

          <div class="form-group">
            <label>Contraseña *</label>
            <input v-model="newUserForm.password" type="password" required minlength="8" />
          </div>

          <div class="form-group">
            <label>Asignar Rol Inicial</label>
            <select v-model="newUserForm.roleIds" multiple class="select-multiple">
              <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" @click="showCreateModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal para Editar Accesos -->
    <div v-if="showAccessModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Gestionar Accesos de @{{ selectedUser?.username }}</h3>
        
        <div class="section">
          <h4>Roles</h4>
          <div class="checkbox-group">
            <label v-for="role in availableRoles" :key="role.id" class="checkbox-item">
              <input type="checkbox" :value="role.id" v-model="selectedRoleIds" />
              {{ role.name }}
            </label>
          </div>
        </div>

        <div class="section">
          <h4>Permisos Directos</h4>
          <div class="checkbox-group">
            <label v-for="perm in availablePermissions" :key="perm.id" class="checkbox-item">
              <input type="checkbox" :value="perm.id" v-model="selectedDirectPermissionIds" />
              {{ perm.slug }} - {{ perm.description }}
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" @click="showAccessModal = false">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" @click="handleSaveAccess">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
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
  padding: 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
}
.badge-role {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.btn-primary {
  background: #1976d2;
  color: #fff;
}
.btn-secondary {
  background: #f0f0f0;
  color: #333;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-card {
  background: #fff;
  padding: 25px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
}
.form-row {
  display: flex;
  gap: 10px;
}
.form-group {
  flex: 1;
  margin-bottom: 15px;
}
.form-group input, .select-multiple {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>