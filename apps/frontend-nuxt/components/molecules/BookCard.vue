<template>
  <div class="book-card">
    <div class="cover">
      <NuxtLink :to="`/book/${encodeURIComponent(id)}`" aria-label="Ver detalle del libro">
        <img :src="cover || placeholder" alt="cover" />
      </NuxtLink>
      <span v-if="badge" class="tag">{{ badge }}</span>
    </div>
    <div class="meta">
      <NuxtLink :to="`/book/${encodeURIComponent(id)}`" class="title">{{ title }}</NuxtLink>
      <div class="subtitle" v-if="subtitle">{{ subtitle }}</div>
      <div class="rating" v-if="rating != null">
        <span v-for="n in 5" :key="n" class="star" :class="{ on: n <= Number(rating) }">★</span>
        <span class="score">{{ rating }}</span>
      </div>
      <slot />
    </div>
  </div>
  
</template>

<script setup lang="ts">
const props = defineProps<{ id: string, title: string, cover?: string, subtitle?: string, badge?: string, rating?: number | string }>()
const placeholder = '/banner.svg'
const badge = props.badge
const rating = props.rating as any
</script>

<style scoped>
.book-card { display: flex; flex-direction: column; background: #0f131b; border:1px solid #222632; border-radius: 16px; overflow: hidden; transition: transform .15s ease, box-shadow .15s ease; }
.book-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,.35); }
.cover { position: relative; width: 100%; aspect-ratio: 3/4; background:#1b2130; }
.cover img { width: 100%; height: 100%; object-fit: cover; display:block; }
.tag { position:absolute; top:10px; left:10px; background:#1b2130; border:1px solid #293140; color:#96ffe2; font-size:12px; padding:4px 8px; border-radius:999px; }
.meta { padding: 12px; display:flex; flex-direction:column; gap:6px; }
.title { font-weight:700; display:block; }
.subtitle { color:#9aa4b2; font-size: 14px; }
.rating { display:flex; align-items:center; gap:6px; }
.star { color:#2a2f3a; }
.star.on { color:#f3c969; }
.score { color:#9aa4b2; font-size: 13px; }
</style>



