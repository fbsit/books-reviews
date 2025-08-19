<template>
  <main class="container" v-if="book">
    <!-- Encabezado con portada e info -->
    <section class="detail-grid">
      <div class="cover">
        <img :src="book.internalCoverUrl || book.coverUrl" alt="cover" />
      </div>
      <div class="info">
        <h1 class="title">{{ book.title }}</h1>
        <div class="byline" v-if="book.author">
          por <strong>{{ book.author }}</strong>
          <span v-if="book.year" class="badge">{{ book.year }}</span>
        </div>
        <div class="row center" v-if="existsInLibrary">
          <StarRating :model-value="displayRating" :readonly="true" :show-value="true" />
        </div>
        <div class="actions">
          <template v-if="!existsInLibrary">
            <button
              v-if="isAuthenticated"
              class="btn primary"
              :disabled="submitting || !isValid"
              @click="onSave"
              :aria-busy="submitting ? 'true' : 'false'"
            >
              <span v-if="submitting" class="mini-spinner" />
              {{ submitting ? 'Guardando…' : 'Agregar a mi Biblioteca' }}
            </button>
            <NuxtLink v-else class="btn secondary" to="/login">Inicia sesión para guardar</NuxtLink>
          </template>
          <div v-else class="inlib">En tu biblioteca</div>
        </div>

        <!-- Formulario de reseña debajo del botón -->
        <div class="card form top-space">
          <label>
            <div class="muted mb6">Tu reseña (máximo 500)</div>
            <textarea class="textarea" rows="6" v-model="review" :maxlength="500" />
          </label>
          <div class="row center">
            <div class="muted">Calificación</div>
            <StarRating v-model="ratingInput" />
          </div>
          <div class="row end gap8">
            <template v-if="existsInLibrary">
              <button class="btn" :disabled="submitting || !isValid" @click="onUpdate" :aria-busy="submitting ? 'true' : 'false'">
                <span v-if="submitting" class="mini-spinner" />
                {{ submitting ? 'Actualizando…' : 'Actualizar' }}
              </button>
              <button class="btn danger" @click="openDeleteModal">Eliminar</button>
            </template>
            <button v-else-if="isAuthenticated" class="btn" :disabled="submitting || !isValid" @click="onSave" :aria-busy="submitting ? 'true' : 'false'">
              <span v-if="submitting" class="mini-spinner" />
              {{ submitting ? 'Guardando…' : 'Guardar' }}
            </button>
            <NuxtLink v-else class="btn secondary" to="/login">Inicia sesión</NuxtLink>
          </div>
          <p v-if="error" class="error">{{ error }}</p>
        </div>
      </div>
    </section>

    

    <div v-if="toast" class="toast">Guardado con éxito</div>
    <ConfirmModal
      :open="confirmOpen"
      title="Eliminar libro"
      message="¿Eliminar este libro de tu biblioteca? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
    />
  </main>
  <main v-else class="container">
    <p class="text-muted">Cargando…</p>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore, type BookSearchItem } from './../../stores/search'
import { useLibraryStore } from './../../stores/library'
import { useAuthStore } from './../../stores/auth'
import StarRating from '../../components/atoms/StarRating.vue'
import ConfirmModal from '../../components/molecules/ConfirmModal.vue'

const route = useRoute()
const id = decodeURIComponent(route.params.id as string)
const search = useSearchStore()
const library = useLibraryStore()
const auth = useAuthStore()
const isAuthenticated = computed(() => !!auth.token)

const book = ref<BookSearchItem | null>(null)
const review = ref('')
const ratingInput = ref<number>(3)
const displayRating = computed(() => {
  const lib = library.books.find(b => b.id === id)
  return Number(lib?.rating || 0)
})
const error = ref<string | null>(null)
const submitting = ref(false)
const toast = ref(false)
const confirmOpen = ref(false)

const isValid = computed(() => review.value.length <= 500 && ratingInput.value >= 1 && ratingInput.value <= 5)
const existsInLibrary = computed(() => !!library.books.find(b => b.id === id))

onMounted(async () => {
  // Prefer data from library if exists
  // Ensure library is loaded if empty
  if (library.books.length === 0) {
    try { await library.fetchLibrary() } catch {}
  }
  const lib = library.books.find(b => b.id === id)
  if (lib) {
    const config = useRuntimeConfig()
    const internalUrl = lib.internalCoverUrl ? `${config.public.apiBase}${lib.internalCoverUrl}` : undefined
    book.value = {
      id: lib.id,
      title: lib.title,
      author: lib.author,
      year: lib.year,
      coverUrl: internalUrl || lib.coverBase64,
      internalCoverUrl: internalUrl
    }
    review.value = lib.review || ''
    ratingInput.value = lib.rating || 3
    return
  }
  // Fallback to last search result
  book.value = search.results.find(r => r.id === id) || null
  // Fetch detail from backend y fusionar preservando autor/año del resultado de búsqueda si existen
  if (!book.value) {
    try {
      const config = useRuntimeConfig()
      const { $apiFetch } = useNuxtApp() as any
      const data = await $apiFetch(`${config.public.apiBase}/api/books/detail/${encodeURIComponent(id)}`) as any
      if (data?.internalCoverUrl) {
        const abs = `${config.public.apiBase}${data.internalCoverUrl}`
        data.coverUrl = abs
        data.internalCoverUrl = abs
      }
      book.value = data
    } catch (e: any) {
      error.value = e?.message || 'No se pudo cargar el libro'
    }
  } else {
    // Ya tenemos info desde la búsqueda; intenta complementar con detalle sin perder autor/año
    try {
      const config = useRuntimeConfig()
      const { $apiFetch } = useNuxtApp() as any
      const data = await $apiFetch(`${config.public.apiBase}/api/books/detail/${encodeURIComponent(id)}`) as any
      if (data?.internalCoverUrl) {
        const abs = `${config.public.apiBase}${data.internalCoverUrl}`
        data.coverUrl = abs
        data.internalCoverUrl = abs
      }
      const current = book.value || {}
      book.value = {
        ...data,
        author: data?.author || (current as any).author,
        year: data?.year || (current as any).year,
        coverUrl: data?.coverUrl || (current as any).coverUrl,
        internalCoverUrl: data?.internalCoverUrl || (current as any).internalCoverUrl
      } as any
    } catch {}
  }
})

async function onSave() {
  if (!book.value) return
  if (!isAuthenticated.value) { error.value = 'Debes iniciar sesión para guardar en tu biblioteca'; return }
  if (!isValid.value) {
    error.value = 'Revisa los datos ingresados'
    return
  }
  submitting.value = true
  error.value = null
  try {
    // obtain base64 from current cover url for new save
    let coverBase64: string | undefined
    const coverUrl = (book.value.internalCoverUrl || book.value.coverUrl)
    if (coverUrl) {
      try {
        const blob = await (await fetch(coverUrl)).blob()
        coverBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch {}
    }

    const saved = await library.saveBook({
      id: book.value.id,
      title: book.value.title,
      author: book.value.author || '',
      year: Number(book.value.year) || 0,
      review: review.value,
      rating: ratingInput.value,
      coverBase64,
    })
    // sync local state y redirigir a la biblioteca
    await library.fetchLibrary()
    navigateTo('/library')
  } catch (e: any) {
    error.value = e?.message || 'No se pudo guardar'
  } finally {
    submitting.value = false
  }
}

async function onUpdate() {
  if (!book.value) return
  if (!isValid.value) return
  submitting.value = true
  error.value = null
  try {
    await library.updateBook(id, { review: review.value, rating: ratingInput.value })
    await library.fetchLibrary()
    navigateTo('/library')
  } catch (e: any) {
    error.value = e?.message || 'No se pudo actualizar'
  } finally {
    submitting.value = false
  }
}

function openDeleteModal() { confirmOpen.value = true }

async function confirmDelete() {
  try {
    await library.deleteBook(id)
    navigateTo('/library')
  } catch (e: any) {
    error.value = e?.message || 'No se pudo eliminar'
  } finally { confirmOpen.value = false }
}
</script>

<style scoped>
.detail-grid { display:grid; grid-template-columns: 280px 1fr; gap:24px; align-items:stretch; }
.cover { width:100%; height:100%; }
.cover img { width:100%; height:100%; object-fit:cover; border-radius:12px; background:#1b2130; display:block; }
.info { display:flex; flex-direction:column; gap:12px; }
.title { margin:0; font-size: 42px; line-height: 1.1; }
.byline { color:#6c7a89; display:flex; align-items:center; gap:10px; }
.badge { background:#1b2130; border:1px solid #293140; color:#9aa4b2; padding:4px 8px; border-radius:999px; font-size:12px; }
.actions { margin-top:6px; }
.inlib { color:#96ffe2; background:#1b2130; border:1px solid #293140; padding:6px 10px; border-radius:8px; display:inline-block; }

.section { margin-top:28px; }
.section-title { margin:0 0 10px; font-size:22px; }
.muted { color:#9aa4b2; }
.mb6 { margin-bottom:6px; }

.reviews-grid { margin-top:12px; display:grid; grid-template-columns: 1fr; gap:24px; align-items:start; }
.card.form { background:#0f131b; border:1px solid #223; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:12px; }
.row { display:flex; gap:10px; }
.row.center { align-items:center; }
.row.end { justify-content:flex-end; }
.gap8 { gap:8px; }
.error { color:#e74c3c; }
.top-space { margin-top: 12px; }
.mini-spinner { width:14px; height:14px; border-radius:50%; border:2px solid #2a2f3a; border-top-color:#2f80ed; display:inline-block; margin-right:8px; animation: spin .8s linear infinite; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; }
  .reviews-grid { grid-template-columns: 1fr; }
}
</style>

