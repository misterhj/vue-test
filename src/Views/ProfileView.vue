<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userService, type UpdateProfilePayload } from '@/services/users.services';

const loading = ref(true);
const saving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Estado para visibilidad de contraseñas
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  identityDocument: '',
  telephone: '',
  password: '',
  confirmPassword: '',
});

const loadProfile = async () => {
  try {
    loading.value = true;
    const user = await userService.getProfile();
    form.value.firstName = user.firstName || '';
    form.value.lastName = user.lastName || '';
    form.value.username = user.username || '';
    form.value.email = user.email || '';
    form.value.identityDocument = user.identityDocument || '';
    form.value.telephone = user.telephone || '';
  } catch (error: any) {
    errorMessage.value = 'Error al cargar la información del usuario.';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  successMessage.value = '';
  errorMessage.value = '';

  if (form.value.password || form.value.confirmPassword) {
    if (form.value.password !== form.value.confirmPassword) {
      errorMessage.value = 'Las contraseñas no coinciden.';
      return;
    }
    if (form.value.password.length < 6) {
      errorMessage.value = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
  }

  try {
    saving.value = true;

    const payload: UpdateProfilePayload = {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      username: form.value.username,
      email: form.value.email,
      identityDocument: form.value.identityDocument || null,
      telephone: form.value.telephone || null,
    };

    if (form.value.password) {
      payload.password = form.value.password;
    }

    await userService.updateProfile(payload);
    
    form.value.password = '';
    form.value.confirmPassword = '';
    
    successMessage.value = 'Perfil actualizado exitosamente.';
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Error al actualizar el perfil.';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="profile-container">
    <h2>Mi Perfil</h2>

    <div v-if="loading" class="loading">Cargando datos del perfil...</div>

    <form v-else @submit.prevent="handleSubmit" class="profile-form">
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Datos Personales -->
      <div class="form-row">
        <div class="form-group">
          <label for="firstName">Nombre</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            required
          />
        </div>

        <div class="form-group">
          <label for="lastName">Apellido</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="identityDocument">Documento de Identidad</label>
          <input
            id="identityDocument"
            v-model="form.identityDocument"
            type="text"
            placeholder="Ej: 1234567"
          />
        </div>

        <div class="form-group">
          <label for="telephone">Teléfono</label>
          <input
            id="telephone"
            v-model="form.telephone"
            type="text"
            placeholder="Ej: +595981123456"
          />
        </div>
      </div>

      <hr class="divider" />

      <h3>Cambiar Contraseña</h3>
      <p class="help-text">Deja estos campos en blanco si no deseas cambiar tu contraseña.</p>

      <!-- Campos de Contraseña con Botón Mostrar/Ocultar -->
      <div class="form-row">
        <div class="form-group">
          <label for="password">Nueva Contraseña</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="toggle-btn"
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="toggle-btn"
              @click="showConfirmPassword = !showConfirmPassword"
              :title="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            >
              <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="saving" class="btn-submit">
          {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 650px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.form-group input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-wrapper input {
  padding-right: 40px;
}

.toggle-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  padding: 4px;
}

.toggle-btn:hover {
  color: #1a2533;
}

.divider {
  margin: 2rem 0 1rem;
  border: 0;
  border-top: 1px solid #eee;
}

.help-text {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 1rem;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background-color: #2b6cb0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-submit:disabled {
  background-color: #a0aec0;
}

.alert {
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-success {
  background-color: #c6f6d5;
  color: #22543d;
}

.alert-error {
  background-color: #fed7d7;
  color: #742a2a;
}
</style>