import { defineStore } from 'pinia'

export interface LibraryBook {
  id: string
  title: string
  author: string
  year: number
  review?: string
  rating?: number
  coverBase64?: string
  internalCoverUrl?: string
}

interface LibraryState {
  books: LibraryBook[]
  loading: boolean
  error: string | null
}

export const useLibraryStore = defineStore('library', {
  state: (): LibraryState => ({
    books: [],
    loading: false,
    error: null
  }),
  actions: {
    serverToClient(doc: any): LibraryBook {
      return {
        id: doc.id || doc._id,
        title: doc.title,
        author: doc.author,
        year: Number(doc.year) || 0,
        review: doc.review,
        rating: doc.rating,
        coverBase64: doc.coverBase64,
        internalCoverUrl: doc.internalCoverUrl
      }
    },
    async fetchLibrary(params: { title?: string; author?: string; excludeNoReview?: boolean; order?: 'asc' | 'desc' } = {}) {
      this.loading = true
      this.error = null
      try {
        const auth = useAuthStore()
        if (!auth.token) { this.books = []; return }
        const config = useRuntimeConfig()
        const { $apiFetch } = useNuxtApp() as any
        const q = new URLSearchParams()
        if (params.title) q.set('title', params.title)
        if (params.author) q.set('author', params.author)
        if (params.excludeNoReview) q.set('excludeNoReview', String(params.excludeNoReview))
        if (params.order) q.set('order', params.order)
        const url = `${config.public.apiBase}/api/books/my-library${q.toString() ? ('?' + q.toString()) : ''}`
        const data = await ( $apiFetch as any )( url, { method: 'GET' } )
        this.books = (data || []).map(this.serverToClient)
      } catch (err: any) {
        this.error = err?.message || 'Error de red'
        this.books = []
      } finally {
        this.loading = false
      }
    },
    async searchLibrary(params: { title?: string; author?: string; excludeNoReview?: boolean; order?: 'asc' | 'desc' } = {}) {
      // alias para compatibilidad
      return this.fetchLibrary(params)
    },
    async saveBook(payload: Omit<LibraryBook, 'coverBase64'> & { coverBase64?: string }) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $apiFetch } = useNuxtApp() as any
        const saved = await ( $apiFetch as any )( `${config.public.apiBase}/api/books/my-library`, {
          method: 'POST',
          body: payload
        })
        const mapped = this.serverToClient(saved)
        const index = this.books.findIndex(b => b.id === mapped.id)
        if (index === -1) this.books.unshift(mapped)
        else this.books[index] = mapped
        return mapped
      } catch (err: any) {
        this.error = err?.message || 'Error de red'
        throw err
      } finally {
        this.loading = false
      }
    },
    async updateBook(id: string, patch: Partial<LibraryBook>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $apiFetch } = useNuxtApp() as any
        const updated = await ( $apiFetch as any )( `${config.public.apiBase}/api/books/my-library/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: patch
        })
        const mapped = this.serverToClient(updated)
        const index = this.books.findIndex(b => b.id === id)
        if (index !== -1) this.books[index] = mapped
        return mapped
      } catch (err: any) {
        this.error = err?.message || 'Error de red'
        throw err
      } finally {
        this.loading = false
      }
    },
    async deleteBook(id: string) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $apiFetch } = useNuxtApp() as any
        await ($apiFetch as any)(`${config.public.apiBase}/api/books/my-library/${encodeURIComponent(id)}`, { method: 'DELETE' })
        this.books = this.books.filter(b => b.id !== id)
      } catch (err: any) {
        this.error = err?.message || 'Error de red'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})


