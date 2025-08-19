<template>
  <div class="layout-root">
    <NuxtRouteAnnouncer />
    <AppHeader />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/organisms/AppHeader.vue'
import AppFooter from '../components/organisms/AppFooter.vue'
</script>

<style scoped>
.layout-root { min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1 0 auto; padding: 24px 16px 96px; }
</style>


