<script setup>
// Escala 1-5 con caritas 😣→😀 (decisión confirmada: caritas, no estrellas).
// Patrón likertScale de Operly. v-model sobre un valor 1..5.
defineProps({
  label: { type: String, default: '' },
  modelValue: { type: Number, default: null },
})
const emit = defineEmits(['update:modelValue'])

const scale = [
  { value: 1, icon: '😣', label: 'Muy mal' },
  { value: 2, icon: '🙁', label: 'Mal' },
  { value: 3, icon: '😐', label: 'Regular' },
  { value: 4, icon: '🙂', label: 'Bien' },
  { value: 5, icon: '😀', label: 'Muy bien' },
]
</script>

<template>
  <div class="emoji-scale">
    <span v-if="label" class="scale-label">{{ label }}</span>
    <div class="scale-options" role="radiogroup" :aria-label="label">
      <button
        v-for="opt in scale"
        :key="opt.value"
        type="button"
        role="radio"
        :aria-checked="modelValue === opt.value"
        :class="['scale-btn', { active: modelValue === opt.value }]"
        :title="opt.label"
        @click="emit('update:modelValue', opt.value)"
      >
        {{ opt.icon }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.emoji-scale {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.scale-label {
  font-size: 0.95rem;
  color: var(--text);
  flex: 1;
}
.scale-options {
  display: flex;
  gap: 4px;
}
.scale-btn {
  width: 44px;
  height: 44px;
  border: 1px solid transparent;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.3rem;
  line-height: 1;
  opacity: 0.45;
  transition: all 0.15s;
}
.scale-btn:hover {
  opacity: 0.8;
}
.scale-btn.active {
  opacity: 1;
  background: var(--accent-bg);
  border-color: var(--accent);
  transform: scale(1.1);
}
@media (max-width: 600px) {
  .emoji-scale {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .scale-options {
    align-self: stretch;
    justify-content: space-between;
  }
}
</style>
