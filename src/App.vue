<script setup>
import { ref, onMounted, watch } from 'vue'

const API_URL = 'http://localhost:8000/api/products'

const products = ref([]);
const search = ref('');
const currentPage = ref(1);
const lastPage = ref(1);
const loading = ref(false);

// Form state
const form = ref({id: null, name: ''})
const isEditing = ref(false);

// Fetch paginated & filtered products
const fetchProducts = async(page = 1) => {
	loading.value = true;

	try{
		const res = await fetch(`${API_URL}?search=${search.value}&page=${page}`)
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
	const url = isEditing.value ? `${API_URL}/${form.value.id}` : API_URL

	try{
		const res = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({name: form.value.name})
		})

		if(res.ok){
			resetForm()
			fetchProducts(currentPage.value)
		}
	}catch(err){
		console.error('Error saving product:', err)
	}

}

const editProduct = (product) => {
	form.value = { ...product}
	isEditing.value = true
}

const deleteProduct = async (id) => {
	if(!confirm('Are you sure you want to delete this product?')) return

	try{
		const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE'})

		if(res.ok){
			fetchProducts(currentPage.value)
		}

	} catch(err){
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
	<div style="max-width: 800px; margin: 40px auto; font-family: system-ui, sans-serif; padding: 0 20px;">
		<h2>Product Management</h2>

		<form @submit.prevent="handleSubmit" style="margin-bottom: 20px; display: flex; gap: 10px;">
			<input
				v-model="form.name"
				type="text"
				placeholder="Product name..."
				required
				style="flex: 1; padding: 8px;"
			/>
			<button type="submit" style="padding: 8px 16px;">
				{{ isEditing ? 'Update' : 'Create' }}
			</button>
			<button v-if="isEditing" type="button" @click="resetForm" style="padding: 8px 16px;">
				Cancel
			</button>
		</form>

		<input
			v-model="search"
			type="text"
			placeholder="Search products..."
			style="width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box;"
		/>

		<div v-if="loading">Loading products...</div>

		<table v-else border="1" cellpadding="8" cellspacing="0" style="width: 100%; text-align: left;">
			<thead>
				<tr>
					<th>ID</th>
					<th>Name</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in products" :key="item.id">
					<td>{{ item.id }}</td>
					<td>{{ item.name }}</td>
					<td>
						<button @click="editProduct(item)">Edit</button>
						<button @click="deleteProduct(item.id)" style="margin-left: 5px; color: red;">Delete</button>
					</td>
				</tr>
				<tr v-if="products.length === 0">
					<td colspan="3" style="text-align: center">No products found</td>
				</tr>
			</tbody>
		</table>

		<div style="margin-top: 15px; display: flex; justify-content: space-betwen; align-items: center;">
			<button :disabled="currentPage === 1" @click="fetchProducts(currentPage - 1)">
				Previus
			</button>
			<span>Page {{ currentPage }} of {{ lastPage }}</span>
			<button :disabled="currentPage === lastPage" @click="fetchProducts(currentPage + 1)">
				Next
			</button>
		</div>
	</div>
</template>