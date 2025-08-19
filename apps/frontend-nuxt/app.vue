<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSearchStore } from './stores/search'
import { useAuthStore } from './stores/auth'
const route = useRoute()
const search = useSearchStore()
const auth = useAuthStore()
auth.hydrateFromStorage()
watch(() => route.fullPath, (to) => {
  // Al salir del home (ruta '/'), reseteamos la búsqueda
  if (to !== '/' && search.query) {
    search.reset()
  }
})
</script>
