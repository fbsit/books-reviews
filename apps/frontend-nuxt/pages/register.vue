<template>
  <main class="container auth">
    <div class="auth-card">
      <h1 class="auth-title text-center">Registro</h1>
      <p class="welcome text-center">Crea tu cuenta para guardar libros y escribir reseñas.</p>
      <form class="stack col" style="gap:16px;" @submit.prevent="onSubmit">
        <input class="input" v-model="username" placeholder="Usuario" autocomplete="username" />
        <input class="input" v-model="password" placeholder="Contraseña (mín. 6)" type="password" autocomplete="new-password" />
        <button class="btn primary" :disabled="loading">Crear cuenta</button>
        <p v-if="error" class="err">{{ error }}</p>
      </form>
      <p class="helper text-center">¿Ya tienes cuenta? <NuxtLink class="link" to="/login">Ir a Login</NuxtLink></p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './../stores/auth'

const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    const config = useRuntimeConfig()
    await $fetch(`${config.public.apiBase}/api/auth/register`, { method: 'POST', body: { username: username.value, password: password.value } })
    // auto login
    const auth = useAuthStore()
    await auth.login(username.value, password.value)
    navigateTo('/library')
  } catch (e: any) {
    const code = e?.data?.message || ''
    if (code === 'username_taken') error.value = 'El usuario ya existe'
    else if (typeof e?.message === 'string' && e.message.includes('fetch')) error.value = 'Error de red. Intenta nuevamente'
    else error.value = 'No se pudo registrar'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth { display:flex; justify-content:center; align-items:center; min-height: calc(100vh - 180px); }
.auth-card {
  width: 100%; max-width: 460px;
  background: #0f131b; border: 1px solid #222632; border-radius: 16px;
  padding: 20px 20px 16px; box-shadow: 0 14px 30px rgba(0,0,0,.35);
}
.auth-title { margin: 6px 0 14px; font-size: 28px; }
.btn.primary { background: linear-gradient(180deg, #2f80ed, #246bd1); }
.err { color:#e74c3c; }
.helper { margin-top: 12px; color:#9aa4b2; }
.link { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:#2a2f3a; color:#fff; }
.link:hover { filter:brightness(1.05); }
</style>


