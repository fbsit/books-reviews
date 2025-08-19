import { defineStore } from 'pinia'

export interface BookSearchItem {
  id: string
  title: string
  coverUrl?: string
  internalCoverUrl?: string
  author?: string
  year?: number
}

interface SearchState {
  query: string
  results: BookSearchItem[]
  loading: boolean
  error: string | null
  history: string[]
}

export const useSearchStore = defineStore('search', {
  state: (): SearchState => ({
    query: '',
    results: [],
    loading: false,
    error: null,
    history: []
  }),
  persist: {
    paths: ['query', 'history']
  },
  actions: {
    setQuery(q: string) {
      this.query = q
    },
    reset() {
      this.query = ''
      this.results = []
      this.error = null
    },
    async fetchHistory() {
      try {
        const auth = useAuthStore()
        if (!auth.token) { this.history = []; return }
        const config = useRuntimeConfig()
        const { $apiFetch } = useNuxtApp() as any
        const url = `${config.public.apiBase}/api/books/last-search`
        const data = await ($apiFetch as any)(url, { method: 'GET' })
        this.history = Array.isArray(data) ? data.slice(0, 5) : []
      } catch (err: any) {
        // keep existing history on error
      }
    },
    async searchBooks() {
      const q = this.query.trim()
      if (!q) {
        this.results = []
        this.error = null
        return
      }
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $apiFetch } = useNuxtApp() as any
        const url = `${config.public.apiBase}/api/books/search?q=${encodeURIComponent(q)}`
        const data = await ($apiFetch as any)(url, { method: 'GET' })
        // prefer internal cover when provided by backend
        this.results = (data || []).map((item: any) => {
          const internal = item.internalCoverUrl ? `${config.public.apiBase}${item.internalCoverUrl}` : undefined
          return {
            ...item,
            coverUrl: internal || item.coverUrl
          }
        })
        // refresh last history from backend
        this.fetchHistory()
      } catch (err: any) {
        this.error = err?.message || 'Error de red'
        this.results = []
      } finally {
        this.loading = false
      }
    },
    async refreshHistoryAfterLogin() {
      await this.fetchHistory()
    }
  }
})


