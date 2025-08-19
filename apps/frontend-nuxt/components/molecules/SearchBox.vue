<template>
  <form class="search" @submit.prevent="onSubmit">
    <div class="search-group" ref="boxRef">
      <input
        ref="inputRef"
        class="search-input"
        type="text"
        :placeholder="placeholder"
        v-model="q"
        @focus="open = true"
        @keydown.enter.prevent="onSubmit"
      />
      <button type="submit" class="search-btn">Buscar</button>
      <transition name="fade-slide">
        <div v-if="open && suggestions.length" class="search-suggest">
          <button v-for="(s, i) in suggestions" :key="i" type="button" class="suggest-item" @click="useHistory(s)">{{ s }}</button>
        </div>
      </transition>
    </div>
    <p v-if="error" class="err">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'

const props = defineProps<{ placeholder: string, loading?: boolean, error?: string | null, history?: string[], suggestions?: string[] }>()
const emit = defineEmits<{ (e: 'search', query: string): void }>()

const q = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const boxRef = ref<HTMLElement | null>(null)
const open = ref(false)
const suggestions = computed(() => (Array.isArray(props.suggestions) ? props.suggestions : (props.history || [])).slice(0, 5))

function onSubmit() {
  emit('search', q.value)
  open.value = false
}

function useHistory(h: string) {
  q.value = h
  emit('search', q.value)
  open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function onDocClick(e: MouseEvent) {
  const el = boxRef.value
  if (el && !el.contains(e.target as Node)) open.value = false
}
</script>

<style>
.search { width: 100%; max-width: 1280px; margin: 24px auto 0; padding: 0 12px; }
.search-group { position: relative; display: flex; align-items: stretch; width: 100%; background: #ffffff; border-radius: 999px; padding: 6px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 10px 18px rgba(0,0,0,.12), 0 0 0 6px rgba(42, 199, 199, .08); }
.search-input { flex: 1; border: none; background: transparent; color: #1a2b34; font-size: 16px; padding: 10px 14px 10px 14px; outline: none; }
.search-input::placeholder { color: #6e8594; }
.search-btn { border: none; padding: 10px 18px; border-radius: 999px; background: linear-gradient(180deg, #0c5c5c, #0a4444); color: #fff; font-weight: 600; }
.search-suggest { position:absolute; top: calc(100% + 8px); left:0; right:0; border:1px solid #d7e0e6; background:#ffffff; border-radius:12px; padding:6px; display:flex; flex-direction:column; gap:4px; box-shadow:0 12px 24px rgba(0,0,0,.15); z-index: 30; }
.suggest-item { width:100%; text-align:left; background:transparent; color:#1a2b34; border:none; padding:10px 12px; border-radius:8px; }
.suggest-item:hover { background:#f4f7f9; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all .12s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity:0; transform: translateY(-6px); }
.err { color:#e74c3c; margin-top:8px; }
@media (max-width:640px) { .search-btn { padding:10px 14px; } }
</style>



