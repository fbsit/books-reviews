<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="brand-block">
        <div class="brand">Nexo Books</div>
        <div class="muted">Descubre, califica y guarda tus libros favoritos.</div>
      </div>
      <nav class="links">
        <a href="https://openlibrary.org" target="_blank" rel="noopener" class="muted">OpenLibrary</a>
        <a href="/library" class="muted">Mi biblioteca</a>
      </nav>
      <div class="copy muted">© {{ year }} · Nuxt 3 + Pinia by Felipe Benitez Sura</div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer { margin-top: 48px; padding: 28px 0; border-top: 3px solid #2f80ed; background: #0f131b; }
.footer-grid { display: grid; gap: 16px; grid-template-columns: 1fr auto auto; align-items: center; }
.brand { font-weight: 700; margin-bottom: 6px; font-size: 18px; }
.brand-block .muted { color:#9aa4b2; }
.links { display:flex; gap:14px; }
.links a { text-decoration:none; }
.copy { justify-self: end; }
@media (max-width: 900px) {
  .footer-grid { grid-template-columns: 1fr; text-align: center; }
  .links { justify-content: center; }
  .copy { justify-self: center; }
}
</style>



