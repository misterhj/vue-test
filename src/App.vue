<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/NavBar.vue'

const token = ref<string | null>(localStorage.getItem('auth_token'))

watchEffect(() => {
  token.value = localStorage.getItem('auth_token')
})

</script>

<template>
	<!-- Layout con menú solo para usuarios autenticados -->
  	<div v-if="token" style="display: flex; min-height: 100vh; font-family: system-ui, sans-serif;">
		<Sidebar />
		<div style="flex: 1; display: flex; flex-direction: column; background: #f8f9fa;">
			<Navbar />
			<main style="padding: 25px; flex: 1;">
				<router-view />
			</main>
		</div>
  	</div>

	<!-- Layout sin menú para usuarios NO autenticados (Login / Registro) -->
	<div v-else style="min-height: 100vh; font-family: system-ui, sans-serif; background: #f8f9fa;">
		<main style="padding: 25px;">
			<router-view />
		</main>
  	</div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>