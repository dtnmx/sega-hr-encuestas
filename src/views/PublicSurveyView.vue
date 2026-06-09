<script setup>
// Formulario público — la página del QR (un solo QR, sin ubicación).
// Flujo: bienvenida → 4 áreas → propuesta+importancia → identidad → enviar.
// Audio por sección: pendiente del siguiente incremento (AudioRecorder).
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSurveyStore } from '../stores/survey'

import WelcomeScreen from '../components/survey/WelcomeScreen.vue'
import ProgressBar from '../components/survey/ProgressBar.vue'
import EmojiScale from '../components/survey/EmojiScale.vue'
import AudioRecorder from '../components/survey/AudioRecorder.vue'
import ImportanceChips from '../components/survey/ImportanceChips.vue'
import IdentityToggle from '../components/survey/IdentityToggle.vue'

const router = useRouter()
const store = useSurveyStore()
const { form, audios, step, submitting } = storeToRefs(store)

const submitError = ref('')

// step 0 = bienvenida; 1..6 = pantallas de contenido.
const CONTENT_SCREENS = 6
const isWelcome = computed(() => step.value === 0)
const isLast = computed(() => step.value === CONTENT_SCREENS)

// Validación por pantalla: hay que responder todo para avanzar.
// "Respondido" = valor != null (N/A guarda 0, que también cuenta).
const stepValid = computed(() => {
  const f = form.value
  switch (step.value) {
    case 1:
      return f.jefatura_comunicacion != null && f.jefatura_trato != null && f.jefatura_apoyo != null
    case 2:
      return f.companeros_equipo != null && f.companeros_respeto != null && f.companeros_ambiente != null
    case 3:
      return f.seguridad_nivel != null
    case 4:
      return f.instalaciones_estado != null && f.instalaciones_limpieza != null && f.instalaciones_comodidad != null
    case 5:
      return f.importancia_top.length >= 1
    case 6:
      return f.is_anonymous || f.employee_name.trim().length > 0
    default:
      return true
  }
})
const stepHint = computed(() => {
  if (stepValid.value) return ''
  if (step.value === 5) return 'Elige al menos un área importante para continuar.'
  if (step.value === 6) return 'Escribe tu nombre o elige “Anónimo”.'
  return 'Responde todas las preguntas para continuar.'
})

// Dirección de la transición: 'next' (desliza hacia la izq.) o 'prev'.
const dir = ref('next')
const transitionName = computed(() => `slide-${dir.value}`)

function next() {
  if (!stepValid.value) return
  if (step.value < CONTENT_SCREENS) {
    dir.value = 'next'
    step.value++
    store.saveDraft() // guarda la sección recién completada
  }
}
function back() {
  if (step.value > 0) {
    dir.value = 'prev'
    step.value--
  }
}

async function onSubmit() {
  submitError.value = ''
  try {
    await store.submit()
    router.push('/gracias')
  } catch (err) {
    submitError.value = 'No se pudo enviar. Revisa tu conexión e intenta de nuevo.'
    console.error('[survey submit]', err)
  }
}

// Autoguardado mientras escribe (debounce) + flush al salir de la página, para
// no perder lo que alcanzó a llenar aunque no presione "Siguiente" ni "Enviar".
let saveTimer = null
function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => store.saveDraft(), 1200)
}
function flushSave() {
  clearTimeout(saveTimer)
  store.saveDraft()
}
function onHidden() {
  if (document.visibilityState === 'hidden') flushSave()
}

watch(form, scheduleSave, { deep: true })

onMounted(() => {
  store.reset()
  window.addEventListener('pagehide', flushSave)
  document.addEventListener('visibilitychange', onHidden)
})

onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  window.removeEventListener('pagehide', flushSave)
  document.removeEventListener('visibilitychange', onHidden)
})
</script>

<template>
  <div class="survey-page">
    <div class="survey-card">
      <!-- Pantalla 0: bienvenida -->
      <WelcomeScreen v-if="isWelcome" @start="next" />

      <template v-else>
        <ProgressBar :current="step - 1" :total="CONTENT_SCREENS" class="progress" />

        <div class="screen-stage">
          <Transition :name="transitionName" mode="out-in" appear>
            <section :key="step" class="screen">
              <!-- 1. Jefatura -->
              <template v-if="step === 1">
                <h2>Tu jefatura inmediata</h2>
                <EmojiScale v-model="form.jefatura_comunicacion" label="Se comunica de forma clara" />
                <EmojiScale v-model="form.jefatura_trato" label="Me trata con respeto" />
                <EmojiScale v-model="form.jefatura_apoyo" label="Me apoya cuando lo necesito" />
                <textarea
                  v-model="form.jefatura_comentario"
                  class="comment"
                  rows="2"
                  placeholder="¿Algo que quieras agregar? (opcional)"
                ></textarea>
                <AudioRecorder v-model="audios.jefatura" />
              </template>

              <!-- 2. Compañeros -->
              <template v-else-if="step === 2">
                <h2>Tus compañeros de trabajo</h2>
                <EmojiScale v-model="form.companeros_equipo" label="Trabajamos bien en equipo" />
                <EmojiScale v-model="form.companeros_respeto" label="Hay respeto entre nosotros" />
                <EmojiScale v-model="form.companeros_ambiente" label="El ambiente es agradable" />
                <textarea
                  v-model="form.companeros_comentario"
                  class="comment"
                  rows="2"
                  placeholder="¿Algo que quieras agregar? (opcional)"
                ></textarea>
                <AudioRecorder v-model="audios.companeros" />
              </template>

              <!-- 3. Seguridad -->
              <template v-else-if="step === 3">
                <h2>Seguridad en el trabajo</h2>
                <EmojiScale v-model="form.seguridad_nivel" label="Me siento seguro en mi área de trabajo" />
                <textarea
                  v-model="form.seguridad_comentario"
                  class="comment"
                  rows="3"
                  placeholder="¿Hay algo inseguro que debamos atender? (opcional)"
                ></textarea>
                <AudioRecorder v-model="audios.seguridad" />
              </template>

              <!-- 4. Instalaciones -->
              <template v-else-if="step === 4">
                <h2>Las instalaciones</h2>
                <EmojiScale v-model="form.instalaciones_estado" label="Están en buen estado" />
                <EmojiScale v-model="form.instalaciones_limpieza" label="Están limpias" />
                <EmojiScale v-model="form.instalaciones_comodidad" label="Son cómodas para trabajar" />
                <textarea
                  v-model="form.instalaciones_comentario"
                  class="comment"
                  rows="2"
                  placeholder="¿Algo que quieras agregar? (opcional)"
                ></textarea>
                <AudioRecorder v-model="audios.instalaciones" />
              </template>

              <!-- 5. Propuesta + Importancia -->
              <template v-else-if="step === 5">
                <h2>¿Qué propondrías para mejorar?</h2>
                <textarea
                  v-model="form.propuesta_libre"
                  class="comment"
                  rows="3"
                  placeholder="Tu idea o sugerencia (opcional)"
                ></textarea>
                <AudioRecorder v-model="audios.propuesta" />
                <h3 class="sub">De todo lo anterior, ¿qué es lo MÁS importante para ti? <span class="hint">(elige hasta 2)</span></h3>
                <ImportanceChips v-model="form.importancia_top" />
              </template>

              <!-- 6. Identidad -->
              <template v-else-if="step === 6">
                <h2>¿Cómo quieres enviar tu respuesta?</h2>
                <IdentityToggle
                  v-model:anonymous="form.is_anonymous"
                  v-model:name="form.employee_name"
                />
              </template>
            </section>
          </Transition>
        </div>

        <!-- Mensaje guía cuando faltan respuestas -->
        <p v-if="stepHint" class="hint-required">{{ stepHint }}</p>

        <!-- Navegación -->
        <div class="nav">
          <button type="button" class="btn ghost" @click="back">Atrás</button>
          <button
            v-if="!isLast"
            type="button"
            class="btn primary"
            :disabled="!stepValid"
            @click="next"
          >
            Siguiente
          </button>
          <button
            v-else
            type="button"
            class="btn primary"
            :disabled="submitting || !stepValid"
            @click="onSubmit"
          >
            {{ submitting ? 'Enviando…' : 'Enviar' }}
          </button>
        </div>
        <p v-if="submitError" class="error">{{ submitError }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.survey-page {
  min-height: 100vh;
  background: var(--bg);
  padding: 24px 16px;
}
.survey-card {
  max-width: 560px;
  margin: 0 auto;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 28px 24px;
}
.progress {
  margin-bottom: 24px;
}
.screen {
  display: flex;
  flex-direction: column;
}
.screen h2 {
  font-size: 1.25rem;
  color: var(--ink);
  margin-bottom: 8px;
}
.sub {
  font-size: 1rem;
  color: var(--text);
  margin: 22px 0 12px;
}
.sub .hint {
  font-weight: 400;
  color: var(--text-faint);
  font-size: 0.82rem;
}
.comment {
  margin-top: 14px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
  resize: vertical;
}
.comment:focus {
  outline: none;
  border-color: var(--accent);
}
.hint-required {
  margin-top: 22px;
  margin-bottom: -8px;
  text-align: center;
  font-size: 0.85rem;
  color: var(--warn);
}
.nav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
}
.btn {
  padding: 13px 28px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.btn.ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border-strong);
}
.btn.ghost:hover {
  border-color: var(--text-muted);
}
.btn.primary {
  background: var(--accent);
  color: #fff;
  margin-left: auto;
}
.btn.primary:hover {
  background: var(--accent-dark);
}
.btn.primary:disabled {
  background: var(--text-faint);
  cursor: not-allowed;
}
.error {
  color: var(--danger);
  text-align: center;
  margin-top: 14px;
  font-size: 0.9rem;
}

/* Transición deslizante entre pantallas */
.screen-stage {
  overflow: hidden;
}
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}
.slide-next-enter-from {
  transform: translateX(36px);
  opacity: 0;
}
.slide-next-leave-to {
  transform: translateX(-36px);
  opacity: 0;
}
.slide-prev-enter-from {
  transform: translateX(-36px);
  opacity: 0;
}
.slide-prev-leave-to {
  transform: translateX(36px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-prev-enter-active,
  .slide-prev-leave-active {
    transition: none;
  }
}
</style>
