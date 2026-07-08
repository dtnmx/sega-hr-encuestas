// Constantes y cálculos compartidos del "Reporte general Tu Voz SEGA"
// (vista /admin/reporte y exportación a Excel). Estructura tomada de la
// propuesta de Cecilia: Propuesta_Reporte general Tu Voz SEGA.xlsx.

// Escala 1–5. Colores de gráfica: par divergente azul↔rojo con neutro gris
// (paleta de referencia dataviz, validada: CVD ΔE 23.6). `pale` es el tinte
// de celda para tablas/Excel (texto en tinta normal encima).
export const LEVELS = [
  { value: 1, label: 'Muy mal', color: '#c93b39', pale: 'F5D0CF' },
  { value: 2, label: 'Mal', color: '#f2a09f', pale: 'FBE4E3' },
  { value: 3, label: 'Regular', color: '#f0efec', pale: 'F0EFEC' },
  { value: 4, label: 'Bien', color: '#86b6ef', pale: 'DCE9FB' },
  { value: 5, label: 'Muy bien', color: '#2a78d6', pale: 'BFD9F5' },
]

// Grupos y factores en el orden del reporte (columnas C..L del Excel).
export const REPORT_AREAS = [
  {
    key: 'jefatura',
    label: 'Jefatura',
    items: [
      ['jefatura_comunicacion', 'Comunicación'],
      ['jefatura_trato', 'Trato'],
      ['jefatura_apoyo', 'Apoyo'],
    ],
  },
  {
    key: 'companeros',
    label: 'Compañeros',
    items: [
      ['companeros_equipo', 'Equipo'],
      ['companeros_respeto', 'Respeto'],
      ['companeros_ambiente', 'Ambiente'],
    ],
  },
  {
    key: 'seguridad',
    label: 'Seguridad',
    items: [['seguridad_nivel', 'Seguridad']],
  },
  {
    key: 'instalaciones',
    label: 'Instalaciones',
    items: [
      ['instalaciones_estado', 'Estado'],
      ['instalaciones_limpieza', 'Limpieza'],
      ['instalaciones_comodidad', 'Comodidad'],
    ],
  },
]

export const RATING_COLS = REPORT_AREAS.flatMap((a) => a.items.map(([k]) => k))

// "Lo más importante para mí" — orden de columnas M..P del Excel.
export const IMPORTANCIA = [
  ['jefatura', 'Jefatura'],
  ['seguridad', 'Seguridad'],
  ['companeros', 'Compañeros'],
  ['instalaciones', 'Instalaciones'],
]

// Distribución de un factor: counts[i] = respuestas con calificación i+1.
// 0 = "No aplica" se cuenta aparte; null no cuenta.
export function factorCounts(rows, col) {
  const counts = [0, 0, 0, 0, 0]
  let na = 0
  for (const r of rows) {
    const v = r[col]
    if (v == null) continue
    if (v === 0) na += 1
    else if (v >= 1 && v <= 5) counts[v - 1] += 1
  }
  const n = counts.reduce((a, b) => a + b, 0)
  return { counts, na, n }
}

// Conteo de menciones en importancia_top por área.
export function importanceCounts(rows) {
  const map = Object.fromEntries(IMPORTANCIA.map(([k]) => [k, 0]))
  for (const r of rows) {
    for (const k of r.importancia_top || []) {
      if (k in map) map[k] += 1
    }
  }
  return map
}

// Promedio general 1–5 sobre todos los factores (excluye null y N/A).
export function overallAverage(rows) {
  let sum = 0
  let n = 0
  for (const r of rows) {
    for (const col of RATING_COLS) {
      const v = r[col]
      if (v != null && v !== 0) {
        sum += v
        n += 1
      }
    }
  }
  return n ? sum / n : null
}

// % de calificaciones favorables (4 y 5) sobre el total calificado.
export function favorableShare(rows) {
  let fav = 0
  let n = 0
  for (const r of rows) {
    for (const col of RATING_COLS) {
      const v = r[col]
      if (v != null && v !== 0) {
        n += 1
        if (v >= 4) fav += 1
      }
    }
  }
  return n ? fav / n : null
}

// Une los comentarios de sección + propuesta en un solo texto
// (columna "COMENTARIOS ADICIONALES" del Excel).
export function combinedComments(r) {
  const parts = []
  if (r.jefatura_comentario) parts.push(`Jefatura: ${r.jefatura_comentario}`)
  if (r.companeros_comentario) parts.push(`Compañeros: ${r.companeros_comentario}`)
  if (r.seguridad_comentario) parts.push(`Seguridad: ${r.seguridad_comentario}`)
  if (r.instalaciones_comentario) parts.push(`Instalaciones: ${r.instalaciones_comentario}`)
  if (r.propuesta_libre) parts.push(`Propuesta: ${r.propuesta_libre}`)
  return parts.join('\n')
}

export function displayName(r) {
  return r.is_anonymous ? 'ANÓNIMO' : (r.employee_name || 'Sin nombre').toUpperCase()
}
