<template>
  <div class="loading" role="status" aria-live="polite" aria-busy="true">
    <span class="spinner" />
    <span class="label">{{ label }}</span>
  </div>
  
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ label?: string }>(), { label: 'Buscando…' })
const label = props.label
</script>

<style scoped>
.loading { display:flex; align-items:center; gap:10px; color:#9aa4b2; }
.spinner { width:18px; height:18px; border-radius:50%; border:3px solid #2a2f3a; border-top-color:#2f80ed; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>



