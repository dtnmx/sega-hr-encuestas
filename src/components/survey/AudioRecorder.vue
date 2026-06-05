<script setup>
// Botón mic + grabación + preview (usa lib/audio-recorder.js).
// v-model: el Blob grabado (null si no hay). Opcional, máx 60 s.
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { createRecorder, isRecordingSupported } from '../../lib/audio-recorder'

const props = defineProps({
  modelValue: { type: Blob, default: null },
  maxSeconds: { type: Number, default: 60 },
})
const emit = defineEmits(['update:modelValue'])

const supported = isRecordingSupported()
const recording = ref(false)
const elapsed = ref(0)
const error = ref('')

let recorder = null
let tick = null

// Preview: object URL derivado del Blob actual.
const objectUrl = ref('')
watch(
  () => props.modelValue,
  (blob) => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = blob ? URL.createObjectURL(blob) : ''
  },
  { immediate: true }
)

const elapsedLabel = computed(() => {
  const s = elapsed.value
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

async function startRec() {
  error.value = ''
  recorder = createRecorder()
  try {
    await recorder.start()
  } catch {
    error.value = 'No pudimos usar el micrófono. Revisa los permisos del navegador.'
    recorder = null
    return
  }
  recording.value = true
  elapsed.value = 0
  tick = setInterval(() => {
    elapsed.value += 1
    if (elapsed.value >= props.maxSeconds) stopRec()
  }, 1000)
}

async function stopRec() {
  if (!recorder) return
  clearInterval(tick)
  tick = null
  recording.value = false
  try {
    const blob = await recorder.stop()
    emit('update:modelValue', blob)
  } catch {
    error.value = 'No se pudo guardar la grabación.'
  } finally {
    recorder = null
  }
}

function remove() {
  emit('update:modelValue', null)
}

onBeforeUnmount(() => {
  if (tick) clearInterval(tick)
  if (recorder) recorder.cancel()
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})
</script>

<template>
  <div v-if="supported" class="audio-recorder">
    <!-- Grabando -->
    <template v-if="recording">
      <span class="rec-dot" aria-hidden="true"></span>
      <span class="rec-time">{{ elapsedLabel }}</span>
      <button type="button" class="ar-btn stop" @click="stopRec">Detener</button>
    </template>

    <!-- Con grabación lista -->
    <template v-else-if="modelValue">
      <audio :src="objectUrl" controls class="ar-audio"></audio>
      <button type="button" class="ar-btn ghost" @click="startRec">Regrabar</button>
      <button type="button" class="ar-btn link-danger" @click="remove">Borrar</button>
    </template>

    <!-- Inicial -->
    <template v-else>
      <button type="button" class="ar-btn rec" @click="startRec">
        🎤 Grabar nota de voz
      </button>
      <span class="ar-hint">opcional · máx {{ maxSeconds }}s</span>
    </template>

    <p v-if="error" class="ar-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.audio-recorder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.ar-btn {
  border: 1px solid var(--border-strong);
  background: #f8fafc;
  color: var(--text);
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}
.ar-btn.rec {
  border-color: var(--accent);
  color: var(--accent-dark);
  background: var(--accent-bg);
  font-weight: 600;
}
.ar-btn.rec:hover {
  background: #fbdedb;
}
.ar-btn.stop {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
}
.ar-btn.ghost:hover {
  border-color: var(--accent);
}
.ar-btn.link-danger {
  border: none;
  background: transparent;
  color: var(--danger);
  padding: 9px 8px;
}
.ar-hint {
  font-size: 0.78rem;
  color: var(--text-faint);
}
.ar-audio {
  height: 38px;
  max-width: 100%;
}
.rec-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  animation: rec-pulse 1s infinite;
}
.rec-time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--text);
}
.ar-error {
  flex-basis: 100%;
  color: var(--danger);
  font-size: 0.82rem;
  margin: 0;
}
@keyframes rec-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rec-dot {
    animation: none;
  }
}
</style>
