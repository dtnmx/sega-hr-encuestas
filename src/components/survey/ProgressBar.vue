<script setup>
// Barra de progreso entre pantallas del formulario.
import { computed } from 'vue'

const props = defineProps({
  current: { type: Number, required: true }, // 0-based
  total: { type: Number, required: true },
})

const pct = computed(() =>
  props.total <= 1 ? 100 : Math.round((props.current / (props.total - 1)) * 100)
)
</script>

<template>
  <div class="progress" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" role="progressbar">
    <div class="track">
      <div class="fill" :style="{ width: pct + '%' }"></div>
    </div>
    <span class="step-text">{{ current + 1 }} / {{ total }}</span>
  </div>
</template>

<style scoped>
.progress {
  display: flex;
  align-items: center;
  gap: 12px;
}
.track {
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease;
}
.step-text {
  font-size: 0.78rem;
  color: var(--text-faint);
  white-space: nowrap;
}
</style>
