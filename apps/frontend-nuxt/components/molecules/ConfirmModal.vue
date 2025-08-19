<template>
  <teleport to="body">
    <div v-if="open" class="cm-wrapper" @keydown.esc.prevent.stop="onCancel">
      <div class="cm-backdrop" @click="onCancel" />
      <div class="cm-dialog" role="dialog" aria-modal="true" :aria-label="title">
        <div class="cm-head">
          <h3 class="cm-title">{{ title }}</h3>
        </div>
        <div class="cm-body">
          <slot>
            <p class="cm-message">{{ message }}</p>
          </slot>
        </div>
        <div class="cm-actions">
          <button class="btn secondary" @click="onCancel">{{ cancelText }}</button>
          <button class="btn danger" @click="onConfirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </teleport>
  
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}>(), {
  title: 'Confirmar',
  message: '¿Estás seguro?',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar'
})

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

function onConfirm() { emit('confirm') }
function onCancel() { emit('cancel') }
</script>

<style scoped>
.cm-wrapper { position: fixed; inset: 0; z-index: 3000; display:flex; align-items:center; justify-content:center; }
.cm-backdrop { position:absolute; inset:0; background: rgba(0,0,0,.55); }
.cm-dialog {
  position: relative; width: 92%; max-width: 460px;
  background: #0f131b; border:1px solid #1c2230; border-radius: 14px; 
  box-shadow: 0 18px 40px rgba(0,0,0,.55); 
  display:flex; flex-direction:column; overflow:hidden;
}
.cm-head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #223; }
.cm-title { margin:0; font-size: 18px; }
.cm-body { padding: 14px; }
.cm-message { margin: 0; color: #e6e6e6; }
.cm-actions { padding: 12px 14px; display:flex; gap:10px; justify-content:flex-end; border-top:1px solid #223; }

</style>


