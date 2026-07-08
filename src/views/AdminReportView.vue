<script setup>
// Reporte general "Tu Voz SEGA" (/admin/reporte): dashboard con la misma
// información de la propuesta de Cecilia — distribución 1–5 por factor,
// "lo más importante para mí", tabla de conteos y tabla general por
// respuesta con responsable editable — más exportación a .xlsx.
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import {
  LEVELS,
  REPORT_AREAS,
  IMPORTANCIA,
  factorCounts,
  importanceCounts,
  overallAverage,
  favorableShare,
  combinedComments,
  displayName,
} from '../lib/report'
import { exportReportXlsx } from '../lib/report-export'

const router = useRouter()
const auth = useAuthStore()

const rows = ref([])
const loading = ref(true)
const error = ref('')
const from = ref('')
const to = ref('')
const exporting = ref(false)
const savedId = ref(null) // fila cuyo "responsable" se acaba de guardar

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    let q = supabase
      .from('survey_responses')
      .select('*')
      .eq('is_complete', true)
      .order('submitted_at', { ascending: true })
    if (from.value) q = q.gte('submitted_at', from.value)
    if (to.value) q = q.lte('submitted_at', `${to.value}T23:59:59`)
    const { data, error: qErr } = await q
    if (qErr) throw qErr
    rows.value = data
  } catch (e) {
    error.value = 'No se pudo cargar el reporte.'
    console.error('[reporte]', e)
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  from.value = ''
  to.value = ''
  fetchData()
}

// ---- Métricas de cabecera ----
const total = computed(() => rows.value.length)
const avg = computed(() => {
  const v = overallAverage(rows.value)
  return v == null ? '—' : v.toFixed(1)
})
const favorable = computed(() => {
  const v = favorableShare(rows.value)
  return v == null ? '—' : `${Math.round(v * 100)}%`
})

// ---- Distribuciones por factor (gráfica divergente + tabla) ----
const areaStats = computed(() =>
  REPORT_AREAS.map((area) => ({
    ...area,
    factors: area.items.map(([key, label]) => ({
      key,
      label,
      ...factorCounts(rows.value, key),
    })),
  }))
)

// Segmentos de la barra divergente centrada en "Regular": el lado negativo
// es muy mal + mal + media parte de regular. Posiciones en % del contenedor
// (cada lado ocupa hasta 50%).
function segmentsFor(f) {
  if (!f.n) return []
  const unit = 50 / f.n // % de contenedor por respuesta
  let x = 50 - (f.counts[0] + f.counts[1] + f.counts[2] / 2) * unit
  const segs = []
  f.counts.forEach((c, i) => {
    if (c > 0) {
      segs.push({ level: LEVELS[i], count: c, left: x, width: c * unit })
      x += c * unit
    }
  })
  return segs
}

function pctNeg(f) {
  return f.n ? Math.round(((f.counts[0] + f.counts[1]) / f.n) * 100) : 0
}
function pctPos(f) {
  return f.n ? Math.round(((f.counts[3] + f.counts[4]) / f.n) * 100) : 0
}

// ---- Lo más importante ----
const importance = computed(() => {
  const counts = importanceCounts(rows.value)
  const max = Math.max(1, ...Object.values(counts))
  return IMPORTANCIA.map(([key, label]) => ({
    key,
    label,
    count: counts[key],
    // 88% máx: deja aire para la etiqueta de conteo al final de la barra.
    width: (counts[key] / max) * 88,
  }))
})

// ---- Tooltip compartido de las gráficas ----
const tip = ref(null) // { x, y, title, text }
function showTip(evt, factor, seg) {
  const host = evt.currentTarget.closest('.report')
  const box = host.getBoundingClientRect()
  const pct = Math.round((seg.count / factor.n) * 100)
  tip.value = {
    x: evt.clientX - box.left,
    y: evt.clientY - box.top,
    title: `${seg.count} de ${factor.n} (${pct}%)`,
    text: `${factor.label} — ${seg.level.label}`,
  }
}
function hideTip() {
  tip.value = null
}

// ---- Responsable editable (columna R del Excel) ----
async function saveResponsable(r, evt) {
  const value = evt.target.value.trim() || null
  if (value === (r.responsable || null)) return
  const { error: uErr } = await supabase
    .from('survey_responses')
    .update({ responsable: value })
    .eq('id', r.id)
  if (uErr) {
    console.error('[reporte responsable]', uErr)
    error.value = 'No se pudo guardar el responsable.'
    return
  }
  r.responsable = value
  savedId.value = r.id
  setTimeout(() => {
    if (savedId.value === r.id) savedId.value = null
  }, 2000)
}

async function onExport() {
  exporting.value = true
  try {
    await exportReportXlsx(rows.value, { from: from.value, to: to.value })
  } catch (e) {
    console.error('[reporte export]', e)
    error.value = 'No se pudo generar el archivo de Excel.'
  } finally {
    exporting.value = false
  }
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function impLabel(key) {
  const found = IMPORTANCIA.find(([k]) => k === key)
  return found ? found[1] : key
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
        <span>Reporte general · Tu Voz SEGA</span>
      </div>
      <div class="user">
        <button class="link" @click="router.push({ name: 'admin-dashboard' })">Panel</button>
        <button class="link" @click="logout">Salir</button>
      </div>
    </header>

    <main class="content report">
      <!-- Filtros (una fila, arriba de todo: aplican a todo el reporte) -->
      <section class="bar">
        <div class="filters">
          <label>Desde <input v-model="from" type="date" @change="fetchData" /></label>
          <label>Hasta <input v-model="to" type="date" @change="fetchData" /></label>
          <button class="ghost" @click="clearFilters">Limpiar</button>
        </div>
        <button class="primary" :disabled="exporting || !rows.length" @click="onExport">
          {{ exporting ? 'Generando…' : 'Exportar a Excel' }}
        </button>
      </section>

      <p v-if="loading && !rows.length" class="state">Cargando…</p>
      <p v-else-if="error" class="state err">{{ error }}</p>
      <p v-else-if="!rows.length" class="state">No hay respuestas completas en este periodo.</p>

      <!-- En refetch se conserva el render anterior atenuado (sin saltos). -->
      <div v-else :class="{ reloading: loading }">
        <!-- KPIs -->
        <section class="tiles">
          <div class="tile">
            <span class="tile-label">Respuestas</span>
            <strong class="tile-value">{{ total }}</strong>
          </div>
          <div class="tile">
            <span class="tile-label">Promedio general (1–5)</span>
            <strong class="tile-value">{{ avg }}</strong>
          </div>
          <div class="tile">
            <span class="tile-label">Calificaciones favorables</span>
            <strong class="tile-value">{{ favorable }}</strong>
          </div>
        </section>

        <!-- Distribución por factor -->
        <section class="card">
          <h2>Satisfacción por factor</h2>
          <div class="legend">
            <span v-for="lv in LEVELS" :key="lv.value" class="legend-item">
              <i class="swatch" :style="{ background: lv.color }"></i>{{ lv.label }}
            </span>
          </div>

          <div v-for="area in areaStats" :key="area.key" class="group">
            <h3>{{ area.label }}</h3>
            <div v-for="f in area.factors" :key="f.key" class="likert-row">
              <span class="factor">{{ f.label }}</span>
              <div class="track">
                <i class="center"></i>
                <button
                  v-for="(seg, i) in segmentsFor(f)"
                  :key="seg.level.value"
                  type="button"
                  class="seg"
                  :class="{ first: i === 0, last: i === segmentsFor(f).length - 1 }"
                  :style="{ left: seg.left + '%', width: seg.width + '%', background: seg.level.color }"
                  :aria-label="`${f.label}: ${seg.level.label}, ${seg.count} respuestas`"
                  @pointerenter="showTip($event, f, seg)"
                  @pointermove="showTip($event, f, seg)"
                  @pointerleave="hideTip"
                  @focus="showTip($event, f, seg)"
                  @blur="hideTip"
                ></button>
              </div>
              <span class="pct neg">{{ pctNeg(f) }}%</span>
              <span class="pct pos">{{ pctPos(f) }}%</span>
            </div>
          </div>
          <p class="hint">% a la izquierda: calificaciones 1–2 · % a la derecha: 4–5. Centrado en "Regular".</p>
        </section>

        <!-- Lo más importante -->
        <section class="card">
          <h2>Lo más importante para mí es…</h2>
          <div v-for="item in importance" :key="item.key" class="imp-row">
            <span class="factor">{{ item.label }}</span>
            <div class="imp-track">
              <div class="imp-bar" :style="{ width: item.width + '%' }"></div>
              <span class="imp-count" :style="{ left: `calc(${item.width}% + 8px)` }">{{ item.count }}</span>
            </div>
          </div>
          <p class="hint">Menciones (cada persona elige hasta 2 áreas).</p>
        </section>

        <!-- Tabla de conteos (hoja "Estadísticas" del Excel) -->
        <section class="card">
          <h2>Conteo de respuestas por calificación</h2>
          <div class="scroll">
            <table class="counts">
              <thead>
                <tr>
                  <th>Factor</th>
                  <th v-for="lv in LEVELS" :key="lv.value">{{ lv.label }}</th>
                  <th>N/A</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="area in areaStats" :key="area.key">
                  <tr class="area-row">
                    <td :colspan="LEVELS.length + 2">{{ area.label }}</td>
                  </tr>
                  <tr v-for="f in area.factors" :key="f.key">
                    <td>{{ f.label }}</td>
                    <td v-for="(c, i) in f.counts" :key="i" class="num">{{ c }}</td>
                    <td class="num">{{ f.na }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Reporte general por respuesta (hoja 1 del Excel) -->
        <section class="card">
          <h2>Reporte general por respuesta</h2>
          <div class="scroll">
            <table class="general">
              <thead>
                <tr>
                  <th rowspan="2">Fecha</th>
                  <th rowspan="2">Nombre</th>
                  <template v-for="area in areaStats" :key="area.key">
                    <th :colspan="area.items.length">{{ area.label }}</th>
                  </template>
                  <th rowspan="2">Lo más importante</th>
                  <th rowspan="2" class="col-comments">Comentarios adicionales</th>
                  <th rowspan="2" class="col-resp">Responsable de propuesta de mejora</th>
                </tr>
                <tr>
                  <template v-for="area in areaStats" :key="area.key">
                    <th v-for="[key, label] in area.items" :key="key" class="sub">{{ label }}</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rows" :key="r.id">
                  <td class="nowrap">{{ fmtDate(r.submitted_at) }}</td>
                  <td class="nowrap">{{ displayName(r) }}</td>
                  <template v-for="area in REPORT_AREAS" :key="area.key">
                    <td
                      v-for="[key] in area.items"
                      :key="key"
                      class="num rating"
                      :style="r[key] >= 1 && r[key] <= 5 ? { background: '#' + LEVELS[r[key] - 1].pale } : {}"
                    >
                      {{ r[key] === 0 ? 'N/A' : (r[key] ?? '·') }}
                    </td>
                  </template>
                  <td>
                    <span v-for="k in r.importancia_top || []" :key="k" class="chip">{{ impLabel(k) }}</span>
                  </td>
                  <td class="comments">{{ combinedComments(r) || 'Sin comentarios' }}</td>
                  <td class="resp">
                    <textarea
                      rows="2"
                      :value="r.responsable || ''"
                      placeholder="Área / persona…"
                      @change="saveResponsable(r, $event)"
                    ></textarea>
                    <span v-if="savedId === r.id" class="saved">Guardado ✓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="hint">El campo "Responsable" se guarda al salir de la celda y se incluye en la exportación.</p>
        </section>
      </div>

      <!-- Tooltip compartido de las gráficas -->
      <div
        v-if="tip"
        class="tooltip"
        :style="{ left: tip.x + 12 + 'px', top: tip.y - 10 + 'px' }"
      >
        <strong>{{ tip.title }}</strong>
        <span>{{ tip.text }}</span>
      </div>
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
.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}
.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
  position: relative;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
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
}
.primary {
  padding: 10px 20px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.state {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}
.state.err {
  color: var(--danger);
}
.reloading {
  opacity: 0.55;
  pointer-events: none;
}

/* KPIs */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 18px;
}
.tile-label {
  display: block;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.tile-value {
  font-size: 1.9rem;
  color: var(--ink);
}

/* Tarjetas */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  margin-bottom: 18px;
}
.card h2 {
  margin: 0 0 12px;
  font-size: 1.02rem;
  color: var(--ink);
}
.hint {
  margin: 12px 0 0;
  font-size: 0.75rem;
  color: var(--text-faint);
}

/* Leyenda */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 14px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(11, 11, 11, 0.1);
}

/* Barras divergentes */
.group h3 {
  margin: 14px 0 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.likert-row {
  display: grid;
  grid-template-columns: 110px 40px 1fr 40px;
  grid-template-areas: 'factor neg track pos';
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}
.factor {
  grid-area: factor;
  font-size: 0.82rem;
  color: var(--text);
}
.track {
  grid-area: track;
  position: relative;
  height: 20px;
}
.center {
  position: absolute;
  left: 50%;
  top: -3px;
  bottom: -3px;
  width: 1px;
  background: var(--border-strong);
}
.seg {
  position: absolute;
  top: 0;
  height: 20px;
  border: none;
  border-left: 2px solid var(--surface);
  padding: 0;
  cursor: default;
}
.seg.first {
  border-left: none;
  border-radius: 4px 0 0 4px;
}
.seg.last {
  border-radius: 0 4px 4px 0;
}
.seg.first.last {
  border-radius: 4px;
}
.seg:hover,
.seg:focus-visible {
  filter: brightness(0.93);
  outline: none;
}
.pct {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.pct.neg {
  grid-area: neg;
  text-align: right;
}
.pct.pos {
  grid-area: pos;
}

/* Lo más importante */
.imp-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.imp-track {
  position: relative;
  height: 20px;
}
.imp-bar {
  height: 20px;
  background: #2a78d6;
  border-radius: 0 4px 4px 0;
}
.imp-count {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.78rem;
  color: var(--ink);
  font-weight: 600;
}

/* Tablas */
.scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.82rem;
}
th,
td {
  border: 1px solid var(--border);
  padding: 6px 9px;
  text-align: left;
  color: var(--text);
}
th {
  background: var(--bg);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.75rem;
}
.counts .num,
.general .num {
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.area-row td {
  background: var(--bg);
  font-weight: 600;
  color: var(--ink);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.general th.sub {
  font-weight: 500;
  font-size: 0.7rem;
}
.general .nowrap {
  white-space: nowrap;
}
.general .rating {
  min-width: 34px;
}
.general .comments {
  min-width: 260px;
  max-width: 420px;
  white-space: pre-line;
  font-size: 0.78rem;
}
.general .col-resp,
.general .resp {
  min-width: 180px;
}
.resp textarea {
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  padding: 5px 7px;
  font-family: inherit;
  font-size: 0.78rem;
  resize: vertical;
}
.saved {
  display: block;
  font-size: 0.7rem;
  color: #15803d;
  margin-top: 2px;
}
.chip {
  display: inline-block;
  margin: 1px 4px 1px 0;
  padding: 1px 8px;
  background: var(--accent-bg);
  color: var(--accent-dark);
  border-radius: 999px;
  font-size: 0.72rem;
  white-space: nowrap;
}

/* Tooltip */
.tooltip {
  position: absolute;
  z-index: 30;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 6px 10px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.tooltip strong {
  font-size: 0.82rem;
  color: var(--ink);
}
.tooltip span {
  font-size: 0.72rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .likert-row {
    grid-template-columns: 1fr 40px 40px;
    grid-template-areas:
      'factor factor factor'
      'track track track'
      'neg . pos';
    row-gap: 2px;
  }
  .pct.neg {
    text-align: left;
  }
  .pct.pos {
    text-align: right;
  }
}
</style>
