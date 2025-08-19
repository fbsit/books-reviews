import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia
  if (pinia && !(pinia as any)._p?.some((p: any) => p?.name === 'persistedstate')) {
    ;(pinia as any).use(piniaPluginPersistedstate)
  }
})


