<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { productService, type Product } from '@/services/product.services'
import { isAuthenticated, authService } from '@/services/auth.services'

const router = useRouter()

const products = ref<Product[]>([])
const search = ref('')
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)

// Agregamos 'price' al estado del formulario
const form = ref<{ id: number | null; name: string; price: number | 0 }>({ 
  id: null,
  name: '',
  price: 0
})
const isEditing = ref(false)

const fetchProducts = async (page = 1) => {
  loading.value = true

  try {
    const data = await productService.getAll(search.value, page)
    products.value = data.data
    currentPage.value = data.current_page
    lastPage.value = data.last_page
  } catch (err: any) {
    console.error('Error al obtener productos:', err)
    if (err.response?.status === 401) {
      authService.logout()
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchProducts(1), 300)
})

const handleSubmit = async () => {
  if (!form.value.name.trim() || form.value.price < 0) return

  try {
    const payload = {
      name: form.value.name,
      price: Number(form.value.price)
    }

    if (isEditing.value && form.value.id) {
      await productService.update(form.value.id, payload)
    } else {
      await productService.create(payload)
    }

    resetForm()
    fetchProducts(currentPage.value)
  } catch (err: any) {
    console.error('Error al guardar producto:', err)
    if (err.response?.status === 401) {
      authService.logout()
      router.push('/login')
    }
  }
}

const editProduct = (item: Product) => {
  form.value = { 
    id: item.id, 
    name: item.name, 
    price: Number(item.price) || 0
  }
  isEditing.value = true
}

const deleteProduct = async (id: number) => {
  if (!confirm('¿Eliminar producto?')) return

  try {
    await productService.delete(id)
    fetchProducts(currentPage.value)
  } catch (err: any) {
    console.error('Error al eliminar producto:', err)
    if (err.response?.status === 401) {
      authService.logout()
      router.push('/login')
    }
  }
}

const resetForm = () => {
  form.value = { id: null, name: '', price: 0 }
  isEditing.value = false
}

onMounted(() => fetchProducts())
</script>

<template>
  <div>
    <!-- Formulario con campo Nombre y Precio -->
    <form v-if="isAuthenticated" @submit.prevent="handleSubmit" style="display: flex; gap: 10px; margin-bottom: 20px;">
      <input 
        type="text" 
        v-model="form.name" 
        placeholder="Nombre del producto" 
        style="flex: 2; padding: 8px;" 
        required 
      />
      <input 
        type="number" 
        step="0.01"
        min="0"
        v-model.number="form.price" 
        placeholder="Precio" 
        style="flex: 1; padding: 8px;" 
        required 
      />
      <button type="submit" style="padding: 8px 16px;">{{ isEditing ? 'Actualizar' : 'Crear' }}</button>
      <button type="button" @click="resetForm" v-if="isEditing" style="padding: 8px 16px;">Cancelar</button>
    </form>

    <h1>Productos</h1>
    <div style="margin-bottom: 20px;">
      <input type="text" v-model="search" placeholder="Buscar productos..." style="padding: 8px; width: 100%; border: 1px solid #ccc; border-radius: 4px;" />
    </div>

    <div v-if="loading">Cargando productos...</div>
    
    <table v-else border="1" cellpadding="8" cellspacing="0" style="width: 100%; text-align: left;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th v-if="isAuthenticated">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in products" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>${{ item.price }}</td>
          <td v-if="isAuthenticated">
            <button @click="editProduct(item)">Editar</button>
            <button @click="deleteProduct(item.id)" style="margin-left: 5px; color: red;">Eliminar</button>
          </td>
        </tr>
        <tr v-if="products.length === 0">
          <td :colspan="isAuthenticated ? 4 : 3" style="text-align: center">No se encontraron productos</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
      <button :disabled="currentPage === 1" @click="fetchProducts(currentPage - 1)">
        Anterior
      </button>
      <span>Página {{ currentPage }} de {{ lastPage }}</span>
      <button :disabled="currentPage === lastPage" @click="fetchProducts(currentPage + 1)">
        Siguiente
      </button>
    </div>
  </div>
</template>