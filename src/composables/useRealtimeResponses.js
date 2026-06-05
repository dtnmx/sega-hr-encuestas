// Suscripción a INSERT events de survey_responses (Supabase Realtime).
// El dashboard recalcula y anima el contador al llegar una respuesta. Fase 3.
//
// TODO: supabase.channel('responses').on('postgres_changes',
//   { event: 'INSERT', schema: 'public', table: 'survey_responses' }, cb)

export function useRealtimeResponses() {
  throw new Error('useRealtimeResponses: pendiente Fase 3')
}
