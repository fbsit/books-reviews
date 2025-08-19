<template>
  <main class="container auth">
    <div class="auth-card">
      <h1 class="auth-title text-center">Login</h1>
      <p class="welcome text-center">Bienvenido de nuevo. Ingresa con tu cuenta para gestionar tu biblioteca.</p>
      <form class="stack col" style="gap:16px;" @submit.prevent="onSubmit">
        <input class="input" v-model="username" placeholder="Usuario" autocomplete="username" />
        <input class="input" v-model="password" placeholder="Contraseña" type="password" autocomplete="current-password" />
        <button class="btn primary" :disabled="auth.loading">Entrar</button>
        <p v-if="auth.error" class="err">{{ auth.error }}</p>
      </form>
      <p class="helper text-center">¿No tienes cuenta? <NuxtLink class="link" to="/register">Crear cuenta</NuxtLink></p>
    </div>
  </main>
  
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const username = ref('demo')
const password = ref('demo123')

async function onSubmit() {
  try {
    await auth.login(username.value, password.value)
    const search = useSearchStore()
    await search.refreshHistoryAfterLogin()
    router.push('/library')
  } catch {}
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


