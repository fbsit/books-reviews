<template>
  <main class="container">
    <h1>Mi biblioteca</h1>
    <div v-if="!isLoggedIn" class="card" style="margin:8px 0; display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <span>Debes iniciar sesión para ver tu biblioteca.</span>
      <NuxtLink class="btn secondary" to="/login">Iniciar sesión</NuxtLink>
    </div>
    <template v-else>
    <!-- Desktop filters inline -->
    <div class="card stack filters desktop" style="gap:12px; align-items:center;">
      <input v-model="term" class="input" placeholder="Buscar por título o autor" />
      <div class="stack" style="gap:10px;">
        <label class="stack" style="gap:6px; min-width:180px;">
          <span class="text-muted" style="min-width:60px;">Orden</span>
          <select v-model="order" class="select">
            <option value="desc">Rating desc</option>
            <option value="asc">Rating asc</option>
          </select>
        </label>
        <label class="stack" style="gap:6px; white-space:nowrap;">
          <input type="checkbox" v-model="excludeNoReview" />
          <span class="text-muted">Excluir sin review</span>
        </label>
        <button class="btn" @click="onSearch">Buscar</button>
      </div>
      <button class="btn toggle-mobile" @click="openFilters = true">Filtros</button>
    </div>

    <!-- Mobile filters sidebar -->
    <div v-if="openFilters" class="backdrop" @click="openFilters=false"></div>
    <aside class="filters-drawer" :class="{ on: openFilters }">
      <div class="drawer-head">
        <div>Filtros</div>
        <button class="btn secondary" @click="openFilters=false">Cerrar</button>
      </div>
      <div class="drawer-body">
        <input v-model="term" class="input" placeholder="Buscar por título o autor" />
        <label class="stack" style="gap:6px;">
          <span class="text-muted" style="min-width:60px;">Orden</span>
          <select v-model="order" class="select">
            <option value="desc">Rating desc</option>
            <option value="asc">Rating asc</option>
          </select>
        </label>
        <label class="stack" style="gap:6px; white-space:nowrap;">
          <input type="checkbox" v-model="excludeNoReview" />
          <span class="text-muted">Excluir sin review</span>
        </label>
        <button class="btn" @click="onSearch(); openFilters=false">Buscar</button>
      </div>
    </aside>

    <div class="spacer" />

    <div v-if="store.loading" class="text-muted">Cargando…</div>
    <div v-else-if="filtered.length === 0" class="text-muted">No hay libros guardados</div>
    <div v-else class="lib-list" style="min-height: 50vh;">
      <div v-for="b in filtered" :key="b.id" class="lib-card card">
        <div class="lib-actions-top">
          <NuxtLink class="icon-btn" :to="`/book/${encodeURIComponent(b.id)}`" title="Ver/Editar" aria-label="Ver/Editar">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>
          </NuxtLink>
          <button class="icon-btn danger" @click="confirmDelete(b)" title="Eliminar" aria-label="Eliminar">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
        <img :src="b.internalCoverUrl || (b.coverBase64 || '')" alt="cover" class="lib-cover" />
        <div class="lib-meta">
          <div class="lib-title">{{ b.title }}</div>
          <div class="text-muted">{{ b.author }} · {{ b.year }}</div>
          <div class="lib-actions">
            <span class="badge">⭐ {{ b.rating ?? '-' }}</span>
          </div>
          <div class="text-muted" v-if="b.review">{{ b.review }}</div>
        </div>
      </div>
    </div>

    
    </template>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLibraryStore, type LibraryBook } from './../stores/library'
import { useAuthStore } from './../stores/auth'

const store = useLibraryStore()
const auth = useAuthStore()
const term = ref('')
const order = ref<'asc' | 'desc'>('desc')
const excludeNoReview = ref(false)
const openFilters = ref(false)

onMounted(() => {
  auth.hydrateFromStorage()
  if (auth.token) {
    store.fetchLibrary()
  }
})

const filtered = computed(() => store.books)
const isLoggedIn = computed(() => Boolean(auth.token))

// edición ahora se gestiona en la vista de detalle

async function confirmDelete(b: LibraryBook) {
  const ok = window.confirm('¿Eliminar libro? Esta acción no se puede deshacer.')
  if (!ok) return
  try { await store.deleteBook(b.id) } catch {}
}

async function onSearch() {
  await store.searchLibrary({
    title: term.value || undefined,
    order: order.value,
    excludeNoReview: excludeNoReview.value || undefined
  })
}
</script>

<style scoped>
.container { max-width: 980px; }
.filters.desktop { display:flex; }
.toggle-mobile { display:none; }
@media (max-width: 760px) {
  .filters.desktop > :not(.toggle-mobile) { display:none; }
  .toggle-mobile { display:inline-flex; margin-left:auto; }
}

.backdrop { position: fixed; inset:0; background: rgba(0,0,0,.45); z-index: 2200; }
.filters-drawer { position: fixed; top:0; right:-320px; width: 320px; height:100%; background:#0f131b; border-left:1px solid #223; z-index: 2300; transition:right .2s ease; display:flex; flex-direction:column; }
.filters-drawer.on { right:0; }
.drawer-head { display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #223; }
.drawer-body { display:flex; flex-direction:column; gap:12px; padding:12px; }
.lib-list { display:grid; gap:20px; grid-template-columns: repeat(2, minmax(0,1fr)); }
@media (max-width: 900px) { .lib-list { grid-template-columns: 1fr; } }

.lib-card { 
  position:relative; 
  display:grid; 
  /* Cover-driven sizing */
  --cover-w: 130px;
  --cover-h: calc(var(--cover-w) * 4 / 3);
  grid-template-columns: var(--cover-w) 1fr; 
  height: calc(var(--cover-h) + 26px);
  gap:12px; 
  align-items:start; 
  padding:10px 12px; 
  padding-top:16px; 
  border-radius:12px; 
}
@media (max-width: 900px) { 
  .lib-card { 
    --cover-w: 100px; 
  } 
}
.lib-actions-top { position: absolute; top: 6px; right: 6px; display:flex; gap:6px; }
.icon-btn { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; background:#1b2130; border:1px solid #293140; }
.icon-btn svg { width:16px; height:16px; }
.icon-btn.danger { background:#a33; border-color:#a33; }
.lib-cover { width:100%; aspect-ratio: 3 / 4; height:auto; object-fit:contain; border-radius:8px; background:#1b2130; }
.lib-meta { display:flex; flex-direction:column; gap:4px; flex:1 1 auto; min-width:0; padding-right:84px; overflow:hidden; }
.lib-title { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lib-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.lib-actions .btn { white-space:nowrap; }
</style>


