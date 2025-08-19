<template>
  <div class="stars" :class="{ readonly }" role="group" aria-label="Calificación">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      class="star"
      :class="{ on: n <= current }"
      :aria-pressed="(n === modelValue)"
      @mouseenter="onHoverEnter(n)"
      @mouseleave="onHoverLeave()"
      @click="onSelect(n)"
      :disabled="readonly"
    >★</button>
    <span v-if="showValue" class="value">{{ modelValue || 0 }}/{{ max }}</span>
  </div>
  
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: number
  max?: number
  readonly?: boolean
  showValue?: boolean
}>(), { max: 5, readonly: false, showValue: false })

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()

const hover = ref(0)
const modelValue = computed(() => Number(props.modelValue || 0))
const max = computed(() => props.max)
const readonly = computed(() => props.readonly)
const showValue = computed(() => props.showValue)
const current = computed(() => hover.value || modelValue.value)

function onHoverEnter(n: number) {
  if (readonly.value) return
  hover.value = n
}
function onHoverLeave() {
  if (readonly.value) return
  hover.value = 0
}

function onSelect(n: number) {
  if (readonly.value) return
  emit('update:modelValue', n)
}
</script>

<style scoped>
.stars { display:inline-flex; align-items:center; gap:6px; }
.star { font-size: 22px; color:#2a2f3a; background:transparent; border:none; cursor:pointer; padding:0; line-height:1; }
.star.on { color:#f3c969; }
.star:disabled { cursor:default; opacity:.75; }
.stars.readonly .star { cursor: default; }
.value { color:#9aa4b2; font-size: 13px; margin-left: 4px; }
</style>



