// Cálculos MEMECS (metodología Dr. Benito Flores, UDEM).
// Mismo patrón que Operly, replicado en JS sobre datos de Supabase.
//
// Fórmulas (ver encuesta_operly_resumen.md §5):
//   % Satisfacción por área = (promedio − 1) / 4 × 100
//   Importancia relativa     = votos del área / total votantes × 100
//   Matriz 2×2               = umbrales = promedio entre áreas (relativos)
//                              cuadrantes: fuerza, vulnerabilidad,
//                                          superioridad, indiferencia
//
// TODO (Fase 2): implementar satisfactionPct, importancePct, buildMatrix.

export const AREAS = ['jefatura', 'companeros', 'seguridad', 'instalaciones']

export function satisfactionPct(/* avg */) {
  throw new Error('memecs: pendiente de implementar en Fase 2')
}
