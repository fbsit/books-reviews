<template>
  <main class="container wide">
    <section class="hero">
      <img src="/banner.svg" alt="Nexo Books" class="hero-img" />
      <div class="hero-overlay">
        <h2 class="hero-title">Descubre, califica y guarda tus libros favoritos</h2>
        <p class="hero-sub">Encuentra títulos populares y construye tu biblioteca personal.</p>
      </div>
    </section>
    <section class="stack col" style="align-items:center;">
      <SearchBox
        :placeholder="'Escribe el nombre de un Libro para continuar'"
        :loading="store.loading"
        :error="store.error"
        :history="store.history"
        :suggestions="store.history"
        @search="onSearch"
      />
      <div class="spacer" />
      <LoadingSpinner v-if="store.loading" />
      <div v-else class="search-info">
        <template v-if="store.query">Resultados para "{{ store.query }}"<span v-if="store.results.length"> ({{ store.results.length }})</span></template>
        <template v-else>Explora y busca tus libros favoritos</template>
      </div>
      <div v-if="!store.loading && store.results.length === 0 && store.query" class="text-muted">
        no encontramos libros con el título ingresado
      </div>
      <div v-if="store.results.length > 0" class="books-grid" style="width:100%; max-width:1100px; min-height: 50vh;">
        <BookCard
          v-for="b in store.results"
          :key="b.id"
          :id="b.id"
          :title="b.title"
          :cover="b.coverUrl"
          :subtitle="b.author ? `${b.author}${b.year ? ' · ' + String(b.year) : ''}` : (b.year != null ? String(b.year) : '')"
        />
      </div>
    </section>
  </main>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from './../stores/search'
import SearchBox from '../components/molecules/SearchBox.vue'
import LoadingSpinner from '../components/atoms/LoadingSpinner.vue'
import BookCard from '../components/molecules/BookCard.vue'

const store = useSearchStore()
// Mostrar solo la búsqueda actual; si no hay, se muestra el texto genérico

async function onSearch(q: string) {
  store.setQuery(q)
  await store.searchBooks()
}

onMounted(() => {
  store.fetchHistory()
})
</script>

<style scoped>
.hero { position:relative; width: 100%; display: flex; justify-content: center; }
.hero-img { width: 100%; max-width: 1100px; height: auto; border-radius: 16px; border: 1px solid #223; }
.hero-overlay { position:absolute; inset:0; display:none; flex-direction:column; justify-content:center; align-items:center; padding: 16px; text-align:center; }
.hero-title { margin:0; color:#ffffff; text-shadow: 0 2px 10px rgba(0,0,0,.4); font-size: 28px; }
.hero-sub { margin-top:6px; color:#e6e6e6; text-shadow: 0 2px 8px rgba(0,0,0,.35); font-size: 14px; }
@media (max-width: 640px) {
  /* En mobile, el texto va debajo de la imagen para no solaparse */
  .hero { flex-direction: column; align-items: center; }
  .hero-img { display: none; }
  .hero-overlay { display:flex; position: static; padding: 10px 12px; }
  .hero-title { font-size: 20px; color:#e6e6e6; text-shadow: none; }
  .hero-sub { font-size: 12px; color:#9aa4b2; text-shadow: none; }
}
.books-grid { display:grid; gap:16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.search-info { color:#9aa4b2; width:100%; max-width:1100px; text-align:left; }
@media (max-width: 1200px) { .books-grid { grid-template-columns: repeat(3, minmax(0,1fr)); } }
@media (max-width: 900px) { .books-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 600px) { .books-grid { grid-template-columns: repeat(1, minmax(0,1fr)); } }
</style>


