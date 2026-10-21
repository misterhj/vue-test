<script setup lang="ts">
import { ref, onMounted } from 'vue'

const token = ref<string | null>(null)

onMounted(() => {
  token.value = localStorage.getItem('auth_token')
})
</script>

<template>
  <div style="text-align: center; padding: 40px 20px;">
    <h1>Home</h1>
  </div>
</template>