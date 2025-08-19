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
  // Mantener resultados al navegar al detalle de libro para conservar autor/año
  if (to !== '/' && !to.startsWith('/book/') && search.query) {
    search.reset()
  }
})
</script>
