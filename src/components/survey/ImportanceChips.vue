<script setup>
// Chips "elige hasta 2" de las 4 áreas (patrón toggleImportance de Operly).
// v-model sobre un array de codes ('jefatura' | 'companeros' | 'seguridad' | 'instalaciones').
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 2 },
})
const emit = defineEmits(['update:modelValue'])

const areas = [
  { key: 'jefatura', label: 'Mi jefatura' },
  { key: 'companeros', label: 'Mis compañeros' },
  { key: 'seguridad', label: 'La seguridad' },
  { key: 'instalaciones', label: 'Las instalaciones' },
]

function toggle(key) {
  const current = [...props.modelValue]
  const i = current.indexOf(key)
  if (i !== -1) {
    current.splice(i, 1)
  } else if (current.length < props.max) {
    current.push(key)
  }
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="chips">
    <button
      v-for="area in areas"
      :key="area.key"
      type="button"
      :class="['chip', { active: modelValue.includes(area.key) }]"
      :disabled="!modelValue.includes(area.key) && modelValue.length >= max"
      @click="toggle(area.key)"
    >
      {{ area.label }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 10px 18px;
  border: 1px solid var(--border-strong);
  background: #f8fafc;
  color: var(--text);
  border-radius: 22px;
  cursor: pointer;
  font-size: 0.92rem;
  transition: all 0.15s;
}
.chip:hover:not(:disabled) {
  border-color: var(--accent);
}
.chip.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
