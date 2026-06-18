<script setup>
// Panel principal (Fase 1): lista de respuestas + filtros por fecha + audio.
// Métricas MEMECS (matriz 2x2, % satisfacción por área) llegan en Fase 2.
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const responses = ref([])
const signed = ref({}) // path -> signedUrl
const loading = ref(true)
const error = ref('')
const from = ref('')
const to = ref('')

const FACES = ['', '😣', '🙁', '😐', '🙂', '😀']

// Render de una calificación: null/sin dato → '·'; 0 → 'N/A'; 1..5 → carita.
function faceFor(v) {
  if (v == null) return '·'
  if (v === 0) return 'N/A'
  return FACES[v]
}

// Configuración de áreas para render (columnas de la tabla survey_responses).
const AREAS = [
  {
    label: 'Jefatura',
    items: [
      ['jefatura_comunicacion', 'Comunicación'],
      ['jefatura_trato', 'Trato'],
      ['jefatura_apoyo', 'Apoyo'],
    ],
    comment: 'jefatura_comentario',
    audio: 'jefatura_audio_url',
  },
  {
    label: 'Compañeros',
    items: [
      ['companeros_equipo', 'Equipo'],
      ['companeros_respeto', 'Respeto'],
      ['companeros_ambiente', 'Ambiente'],
    ],
    comment: 'companeros_comentario',
    audio: 'companeros_audio_url',
  },
  {
    label: 'Seguridad',
    items: [['seguridad_nivel', 'Nivel']],
    comment: 'seguridad_comentario',
    audio: 'seguridad_audio_url',
  },
  {
    label: 'Instalaciones',
    items: [
      ['instalaciones_estado', 'Estado'],
      ['instalaciones_limpieza', 'Limpieza'],
      ['instalaciones_comodidad', 'Comodidad'],
    ],
    comment: 'instalaciones_comentario',
    audio: 'instalaciones_audio_url',
  },
]
const AUDIO_COLS = [
  'jefatura_audio_url',
  'companeros_audio_url',
  'seguridad_audio_url',
  'instalaciones_audio_url',
  'propuesta_audio_url',
]
const RATING_COLS = AREAS.flatMap((a) => a.items.map(([k]) => k))

// Completas = encuesta enviada; parciales = abandonada a medias (is_complete=false).
const completas = computed(() => responses.value.filter((r) => r.is_complete))
const total = computed(() => completas.value.length)
const parciales = computed(() => responses.value.length - completas.value.length)
const avgGeneral = computed(() => {
  let sum = 0
  let n = 0
  for (const r of completas.value) {
    for (const col of RATING_COLS) {
      // 0 = "No aplica": se excluye del promedio igual que null.
      if (r[col] != null && r[col] !== 0) {
        sum += r[col]
        n += 1
      }
    }
  }
  return n ? (sum / n).toFixed(1) : '—'
})

function fmtDate(ts) {
  return new Date(ts).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    let q = supabase
      .from('survey_responses')
      .select('*')
      .order('submitted_at', { ascending: false })
    if (from.value) q = q.gte('submitted_at', from.value)
    if (to.value) q = q.lte('submitted_at', `${to.value}T23:59:59`)
    const { data, error: qErr } = await q
    if (qErr) throw qErr
    responses.value = data
    await signAudios(data)
  } catch (e) {
    error.value = 'No se pudieron cargar las respuestas.'
    console.error('[dashboard]', e)
  } finally {
    loading.value = false
  }
}

// Crea signed URLs para todas las notas de voz presentes (bucket privado).
async function signAudios(rows) {
  const paths = []
  for (const r of rows) {
    for (const col of AUDIO_COLS) {
      if (r[col]) paths.push(r[col])
    }
  }
  if (!paths.length) {
    signed.value = {}
    return
  }
  const { data } = await supabase.storage
    .from('survey-audios')
    .createSignedUrls(paths, 3600)
  const map = {}
  for (const it of data || []) {
    if (it.signedUrl) map[it.path] = it.signedUrl
  }
  signed.value = map
}

function clearFilters() {
  from.value = ''
  to.value = ''
  fetchData()
}

async function logout() {
  await auth.signOut()
  router.push({ name: 'admin-login' })
}

onMounted(fetchData)
</script>

<template>
  <div class="dash">
    <header class="topbar">
      <div class="brand">
        <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo" />
        <span>Panel de resultados</span>
      </div>
      <div class="user">
        <span class="email">{{ auth.user?.email }}</span>
        <button class="link" @click="router.push({ name: 'admin-password' })">Cambiar contraseña</button>
        <button class="link" @click="logout">Salir</button>
      </div>
    </header>

    <main class="content">
      <!-- Filtros + stats -->
      <section class="bar">
        <div class="filters">
          <label>Desde <input v-model="from" type="date" @change="fetchData" /></label>
          <label>Hasta <input v-model="to" type="date" @change="fetchData" /></label>
          <button class="ghost" @click="clearFilters">Limpiar</button>
        </div>
        <div class="stats">
          <div class="stat">
            <strong>{{ total }}</strong>
            <span>respuestas</span>
          </div>
          <div v-if="parciales" class="stat">
            <strong>{{ parciales }}</strong>
            <span>parciales</span>
          </div>
          <div class="stat">
            <strong>{{ avgGeneral }}</strong>
            <span>promedio (1–5)</span>
          </div>
        </div>
      </section>

      <p v-if="loading" class="state">Cargando…</p>
      <p v-else-if="error" class="state err">{{ error }}</p>
      <p v-else-if="!responses.length" class="state">Aún no hay respuestas en este periodo.</p>

      <!-- Lista de respuestas -->
      <ul v-else class="list">
        <li v-for="r in responses" :key="r.id" class="card">
          <div class="card-head">
            <span class="date">{{ fmtDate(r.submitted_at) }}</span>
            <span class="who">{{ r.is_anonymous ? 'Anónimo' : r.employee_name || 'Sin nombre' }}</span>
            <span v-if="!r.is_complete" class="status parcial">parcial</span>
            <span :class="['status', r.status]">{{ r.status }}</span>
          </div>

          <div class="areas">
            <div v-for="area in AREAS" :key="area.label" class="area">
              <h4>{{ area.label }}</h4>
              <div class="ratings">
                <span v-for="[col, lbl] in area.items" :key="col" class="rating">
                  <span :class="['face', { na: r[col] === 0 }]">{{ faceFor(r[col]) }}</span>
                  <span class="rlabel">{{ lbl }}</span>
                </span>
              </div>
              <p v-if="r[area.comment]" class="comment">“{{ r[area.comment] }}”</p>
              <audio
                v-if="r[area.audio] && signed[r[area.audio]]"
                :src="signed[r[area.audio]]"
                controls
                class="audio"
              ></audio>
            </div>
          </div>

          <div v-if="r.propuesta_libre || r.propuesta_audio_url" class="propuesta">
            <h4>Propuesta</h4>
            <p v-if="r.propuesta_libre" class="comment">“{{ r.propuesta_libre }}”</p>
            <audio
              v-if="r.propuesta_audio_url && signed[r.propuesta_audio_url]"
              :src="signed[r.propuesta_audio_url]"
              controls
              class="audio"
            ></audio>
          </div>

          <div v-if="r.importancia_top?.length" class="importance">
            Más importante para esta persona:
            <span v-for="k in r.importancia_top" :key="k" class="chip">{{ k }}</span>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.dash {
  min-height: 100vh;
  background: var(--bg);
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: var(--ink);
}
.brand .logo {
  height: 30px;
}
.user {
  display: flex;
  align-items: center;
  gap: 14px;
}
.user .email {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}
.content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}
.filters label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.filters input {
  padding: 8px 10px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  font-family: inherit;
}
.ghost {
  padding: 9px 16px;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  height: fit-content;
}
.stats {
  display: flex;
  gap: 12px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 18px;
  text-align: center;
  min-width: 92px;
}
.stat strong {
  display: block;
  font-size: 1.5rem;
  color: var(--accent);
}
.stat span {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.state {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}
.state.err {
  color: var(--danger);
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border);
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.card-head .date {
  font-weight: 600;
  color: var(--ink);
}
.card-head .who {
  color: var(--text-muted);
  font-size: 0.88rem;
}
.status {
  margin-left: auto;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent-dark);
}
.status.parcial {
  background: #fef3c7;
  color: #b45309;
}
.status.revisado {
  background: #e0f2fe;
  color: #0369a1;
}
.status.atendido {
  background: #dcfce7;
  color: #15803d;
}
.areas {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.area h4,
.propuesta h4 {
  margin: 0 0 8px;
  font-size: 0.92rem;
  color: var(--ink);
}
.ratings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.7rem;
  color: var(--text-faint);
}
.rating .face {
  font-size: 1.2rem;
}
.rating .face.na {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-faint);
}
.comment {
  margin: 10px 0 0;
  font-style: italic;
  color: var(--text);
  font-size: 0.9rem;
}
.audio {
  margin-top: 10px;
  height: 36px;
  width: 100%;
  max-width: 280px;
}
.propuesta {
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.importance {
  margin-top: 14px;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.importance .chip {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 10px;
  background: var(--accent-bg);
  color: var(--accent-dark);
  border-radius: 999px;
  font-size: 0.78rem;
}
@media (max-width: 600px) {
  .areas {
    grid-template-columns: 1fr;
  }
}
</style>
