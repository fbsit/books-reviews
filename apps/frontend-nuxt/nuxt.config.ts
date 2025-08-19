// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'nuxt-vitest'],
  css: ['~/assets/styles/main.scss'],
  alias: {
    '@': process.cwd(),
  },
  runtimeConfig: {
    public: { 
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001'
    }
  }
})
