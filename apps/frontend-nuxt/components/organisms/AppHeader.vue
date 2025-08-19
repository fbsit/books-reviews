<template>
  <header class="site-header">
    <div class="header-wrap">
      <NuxtLink to="/" class="stack brand-row" style="gap:8px; align-items:center;">
        <span style="font-weight:700; font-size:18px;">Nexo Books</span>
      </NuxtLink>
      <div v-if="auth?.user" class="stack user-area" style="gap:8px; align-items:center;" ref="menuRef">
        <!-- Desktop: single dropdown button "User: name" -->
        <div class="user-dd">
          <button class="btn secondary user-menu-btn" @click="open = !open" @keydown.escape="open=false">
            <span class="user-label">User: {{ usernameDisplay }}</span>
            <svg class="caret" :class="{ up: open }" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
          </button>
          <transition name="fade-slide">
            <div v-if="open" class="dropdown">
              <NuxtLink to="/library" class="btn">Mi biblioteca</NuxtLink>
              <button class="btn danger" @click="onLogout">Cerrar sesión</button>
            </div>
          </transition>
        </div>
        <!-- Mobile: button shows username and opens sidebar -->
        <button class="hamburger" @click="openUserSidebar" aria-label="Abrir menú" >
          <span class="user-mobile-name">{{ usernameDisplay }}</span>
          <span class="bars"><span></span><span></span><span></span></span>
        </button>
      </div>
      <div v-else class="stack" style="gap:12px;">
        <NuxtLink to="/login" class="btn">Login</NuxtLink>
        <NuxtLink to="/register" class="btn secondary">Registro</NuxtLink>
      </div>
    </div>

    <!-- Mobile sidebar -->
    <div v-if="ui.activeSidebar === 'user'" class="backdrop" @click="ui.closeSidebar()"></div>
    <aside v-if="ui.activeSidebar === 'user'" class="sidebar on" role="dialog" aria-modal="true">
      <div class="sidebar-header">
        <span>User: {{ usernameDisplay }}</span>
        <button class="close-btn" @click="ui.closeSidebar()">Cerrar</button>
      </div>
      <nav class="sidebar-nav">
        <NuxtLink to="/library" class="side-link" @click="ui.closeSidebar()">Mi biblioteca</NuxtLink>
        <button class="side-link danger" @click="onLogout">Cerrar sesión</button>
      </nav>
    </aside>
  </header>
  <div style="height:1px; background:#1f2430;" />
  <div class="spacer" />
  
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from './../../stores/auth'
import { useUiStore } from './../../stores/ui'
const auth = useAuthStore()
const ui = useUiStore()
const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const sidebar = ref(false)
const usernameDisplay = computed(() => {
  const u = auth?.user?.username || ''
  return u ? u.charAt(0).toUpperCase() + u.slice(1) : ''
})
function onDocClick(e: MouseEvent) {
  if (!open.value) return
  const el = menuRef.value
  if (el && !el.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
async function onLogout() {
  open.value = false
  sidebar.value = false
  ui.closeSidebar()
  await auth.logout()
  navigateTo('/')
}

// Close menus/sidebars when auth token changes (e.g., auto-logout on 401)
watch(() => auth.token, () => {
  open.value = false
  sidebar.value = false
  ui.closeSidebar()
})

function openUserSidebar() {
  ui.openSidebar('user')
}
</script>

<style scoped>
.site-header { padding: 14px 0; position: sticky; top:0; backdrop-filter: saturate(140%) blur(8px); background: rgba(11,14,20,.75); z-index: 300; border-bottom: 1px solid rgba(124,92,255,.18); }
.header-wrap { display:flex; align-items:center; justify-content: space-between; width:100%; max-width:1100px; margin:0 auto; padding: 0 24px; }
.brand-row { flex: 1 1 auto; }
.user-dd { position: relative; }
.user-menu-btn { display:inline-flex; align-items:center; gap:8px; height:36px; padding:0 12px; }
.user-label { white-space:nowrap; }
.caret { width:14px; height:14px; transition: transform .15s ease; }
.caret.up { transform: rotate(180deg); }
.dropdown { position:absolute; top: calc(100% + 8px); right: 0; padding:8px; gap:8px; display:flex; flex-direction:column; width: 200px; border:1px solid #223; background:#0f131b; border-radius: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.35); z-index: 999; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all .15s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }

.user-pill { display:inline-flex; align-items:center; height:36px; padding:0 12px; border-radius:999px; background:#1b2130; border:1px solid #293140; color:#e6e6e6; font-weight:600; }
.dropdown-btn { display:inline-flex; align-items:center; gap:6px; height:36px; }
.dropdown-btn .caret { width:16px; height:16px; }
.dropdown .btn { width:100%; text-align:center; border-radius:10px; }

/* Hamburger only on small screens */
.hamburger { display:none; height:36px; background:#1b2130; border:1px solid #293140; border-radius:10px; align-items:center; justify-content:center; gap:8px; padding:0 10px; box-shadow: 0 6px 16px rgba(124,92,255,.18); }
.hamburger .bars span { display:block; width:18px; height:2px; background:#e6e6e6; }
.hamburger .bars { display:inline-flex; flex-direction:column; gap:3px; }
.hamburger .user-mobile-name { font-weight:600; color:#e6e6e6; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
@media (max-width: 760px) {
  .user-menu-btn { display:none; }
  .hamburger { display:inline-flex; }
}

/* Sidebar */
.backdrop { position: fixed; inset:0; background: rgba(0,0,0,.45); z-index: 2200; }
.sidebar { position: fixed; top:0; left:0; right:0; width: 100vw; height:100vh; background:#0f131b; z-index: 2300; transform: translateX(100%); transition: transform .25s ease; display:flex; flex-direction:column; overflow:auto; }
.sidebar.on { transform: translateX(0); }
.sidebar-header { padding: 16px; font-weight: 700; border-bottom:1px solid #223; display:flex; align-items:center; justify-content:space-between; }
.close-btn { 
  appearance: none; border:1px solid #293140; background:#1b2130; color:#e6e6e6; 
  padding:6px 10px; border-radius:10px; cursor:pointer; 
  box-shadow: 0 4px 12px rgba(0,0,0,.25); transition: filter .12s ease, transform .12s ease; 
}
.close-btn:hover { filter: brightness(1.06); }
.close-btn:active { transform: translateY(1px); }
.sidebar-nav { display:flex; flex-direction:column; padding: 12px; gap:8px; }
.side-link { display:block; padding:10px 12px; border:1px solid #223; border-radius:8px; background:#1b2130; color:#e6e6e6; text-align:center; }
.side-link.danger { background:#a33; border-color:#a33; }

/* Sidebar visible solo en mobile */
@media (min-width: 761px) {
  .backdrop, .sidebar { display:none !important; }
}
</style>



