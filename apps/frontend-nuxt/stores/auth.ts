import { defineStore } from 'pinia'

interface User { id: string; username: string }

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ token: null, user: null, loading: false, error: null }),
  actions: {
    async login(username: string, password: string) {
      this.loading = true; this.error = null
      try {
        const config = useRuntimeConfig()
        const res = await $fetch<{ token: string, user: User }>(`${config.public.apiBase}/api/auth/login`, {
          method: 'POST', body: { username, password }
        })
        this.token = res.token
        this.user = res.user
        if (process.client) {
          localStorage.setItem('auth.token', this.token)
          localStorage.setItem('auth.user', JSON.stringify(this.user))
        }
      } catch (e: any) {
        const code = e?.data?.message || ''
        if (code === 'invalid_credentials') this.error = 'Usuario o contraseña incorrectos'
        else if (code === 'unauthorized') this.error = 'No autorizado'
        else if (typeof e?.message === 'string' && e.message.includes('fetch')) this.error = 'Error de red. Intenta nuevamente'
        else this.error = 'No se pudo iniciar sesión'
        throw e
      } finally { this.loading = false }
    },
    async logout() {
      try {
        const config = useRuntimeConfig()
        if (this.token) {
          await $fetch(`${config.public.apiBase}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}` } })
        }
      } catch {}
      this.token = null; this.user = null
      if (process.client) {
        localStorage.removeItem('auth.token')
        localStorage.removeItem('auth.user')
      }
    },
    hydrateFromStorage() {
      if (!process.client) return
      try {
        const t = localStorage.getItem('auth.token')
        const u = localStorage.getItem('auth.user')
        if (t) this.token = t
        if (u) this.user = JSON.parse(u)
      } catch {}
    }
  }
})


