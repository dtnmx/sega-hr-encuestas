<script setup>
// Formulario público — la página del QR (ruta /?loc=planta1).
// Flujo: bienvenida → 4 áreas → propuesta+importancia → identidad → enviar.
// Audio por sección: pendiente del siguiente incremento (AudioRecorder).
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { supabase } from '../lib/supabase'
import { useSurveyStore } from '../stores/survey'

import WelcomeScreen from '../components/survey/WelcomeScreen.vue'
import ProgressBar from '../components/survey/ProgressBar.vue'
import EmojiScale from '../components/survey/EmojiScale.vue'
import ImportanceChips from '../components/survey/ImportanceChips.vue'
import IdentityToggle from '../components/survey/IdentityToggle.vue'

const route = useRoute()
const router = useRouter()
const store = useSurveyStore()
const { form, step, submitting } = storeToRefs(store)

const locationName = ref('SEGA')
const submitError = ref('')

// step 0 = bienvenida; 1..6 = pantallas de contenido.
const CONTENT_SCREENS = 6
const isWelcome = computed(() => step.value === 0)
const isLast = computed(() => step.value === CONTENT_SCREENS)

function next() {
  if (step.value < CONTENT_SCREENS) step.value++
}
function back() {
  if (step.value > 0) step.value--
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

onMounted(async () => {
  store.reset()
  const loc = route.query.loc
  if (!loc) return
  // Buscar el nombre legible; si no existe/activa, dejar location en null
  // (evita violar el FK) y mostrar "SEGA".
  const { data } = await supabase
    .from('locations')
    .select('code, name')
    .eq('code', loc)
    .eq('active', true)
    .maybeSingle()
  if (data) {
    locationName.value = data.name
    store.setLocation(data.code)
  }
})
</script>

<template>
  <div class="survey-page">
    <div class="survey-card">
      <!-- Pantalla 0: bienvenida -->
      <WelcomeScreen v-if="isWelcome" :location-name="locationName" @start="next" />

      <template v-else>
        <ProgressBar :current="step - 1" :total="CONTENT_SCREENS" class="progress" />

        <!-- 1. Jefatura -->
        <section v-if="step === 1" class="screen">
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
        </section>

        <!-- 2. Compañeros -->
        <section v-if="step === 2" class="screen">
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
        </section>

        <!-- 3. Seguridad -->
        <section v-if="step === 3" class="screen">
          <h2>Seguridad en el trabajo</h2>
          <EmojiScale v-model="form.seguridad_nivel" label="Me siento seguro en mi área de trabajo" />
          <textarea
            v-model="form.seguridad_comentario"
            class="comment"
            rows="3"
            placeholder="¿Hay algo inseguro que debamos atender? (opcional)"
          ></textarea>
        </section>

        <!-- 4. Instalaciones -->
        <section v-if="step === 4" class="screen">
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
        </section>

        <!-- 5. Propuesta + Importancia -->
        <section v-if="step === 5" class="screen">
          <h2>¿Qué propondrías para mejorar?</h2>
          <textarea
            v-model="form.propuesta_libre"
            class="comment"
            rows="3"
            placeholder="Tu idea o sugerencia (opcional)"
          ></textarea>
          <h3 class="sub">De todo lo anterior, ¿qué es lo MÁS importante para ti? <span class="hint">(elige hasta 2)</span></h3>
          <ImportanceChips v-model="form.importancia_top" />
        </section>

        <!-- 6. Identidad -->
        <section v-if="step === 6" class="screen">
          <h2>¿Cómo quieres enviar tu respuesta?</h2>
          <IdentityToggle
            v-model:anonymous="form.is_anonymous"
            v-model:name="form.employee_name"
          />
        </section>

        <!-- Navegación -->
        <div class="nav">
          <button type="button" class="btn ghost" @click="back">Atrás</button>
          <button
            v-if="!isLast"
            type="button"
            class="btn primary"
            @click="next"
          >
            Siguiente
          </button>
          <button
            v-else
            type="button"
            class="btn primary"
            :disabled="submitting"
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
</style>
