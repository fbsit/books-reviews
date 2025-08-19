import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin(() => {
  const auth = useAuthStore();
  const apiFetch = $fetch.create({
    onRequest({ options }) {
      const token = auth.token;
      options.headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
      if (options.body && !(options.headers as any)['Content-Type']) {
        (options.headers as any)['Content-Type'] = 'application/json'
      }
    },
    async onResponseError({ response }) {
      if (response && response.status === 401) {
        try { await auth.logout() } catch {}
        try { await navigateTo('/login') } catch {}
      }
    }
  })
  return { provide: { apiFetch } }
})


