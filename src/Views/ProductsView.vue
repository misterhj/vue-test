<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_URL = 'http://localhost:8000/api'

const products = ref([]);
const search = ref('');
const currentPage = ref(1);
const lastPage = ref(1);
const loading = ref(false);
const token = ref(localStorage.auth_token || '')

const form = ref({id: null, name: ''})
const isEditing = ref(false);

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token.value}`
})

const fetchProducts = async(page = 1) => {
    loading.value = true;

    try{
        const res = await fetch(`${API_URL}/products?search=${search.value}&page=${page}`)
        const data = await res.json()

        products.value = data.data
        currentPage.value = data.current_page
        lastPage.value = data.last_page
    }catch(err){
        console.error('Error connecting to Laravel API:', err)
    }finally{
        loading.value = false
    }
}

let searchTimeout = null;
watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => fetchProducts(1), 300)
})

const handleSubmit = async () => {
    if(!form.value.name.trim()) return

    const method = isEditing.value ? 'PUT' : 'POST'
    const url = isEditing.value ? `${API_URL}/products/${form.value.id}` : `${API_URL}/products`

    try{
        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify({name: form.value.name})
        })

        if(res.status === 401) {
            localStorage.removeItem('auth_token')
            router.push('/login')
            return
        }

        if(res.ok){
            resetForm()
            fetchProducts(currentPage.value)
        }
    }catch(err){
        console.error('Error saving product:', err)
    }
}

const editProduct = (item) => {
    form.value = { ...item}
    isEditing.value = true
}

const deleteProduct = async (id) => {
    if(!confirm('Eliminar producto?')) return

    try{
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        })

        if(res.status === 401) {
            localStorage.removeItem('auth_token')
            router.push('/login')
            return
        }

        if(res.ok){
            fetchProducts(currentPage.value)
        }
    }catch(err){
        console.error('Error deleting product:', err)
    }
}

const resetForm = () => {
    form.value = { id: null, name: '' }
    isEditing.value = false
}

onMounted(() => fetchProducts())
</script>

<template>
  <div>

    <form v-if="token" @submit.prevent="handleSubmit" style="display: flex; gap: 10px; margin-bottom: 20px;">
      <input type="text" v-model="form.name" placeholder="Nombre del producto" style="flex: 1; padding: 8px;" required />
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
                <th>Name</th>
                <th v-if="token">Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in products" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.name }}</td>
                <td v-if="token">
                    <button @click="editProduct(item)">Editar</button>
                    <button @click="deleteProduct(item.id)" style="margin-left: 5px; color: red;">Eliminar</button>
                </td>
            </tr>
            <tr v-if="products.length === 0">
                <td colspan="3" style="text-align: center">No products found</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 15px; display: flex; justify-content: space-betwen; align-items: center;">
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