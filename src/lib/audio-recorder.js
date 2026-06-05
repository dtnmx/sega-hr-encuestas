// Wrapper de MediaRecorder para grabar respuestas de voz.
// Formato objetivo: audio/webm; codecs=opus (~24 kbps, máx 60 s — ver .md §4).
//
// TODO (Fase 1): implementar start/stop/preview/reset y devolver el Blob
// listo para subir a supabase.storage.from('survey-audios').

export function createAudioRecorder() {
  throw new Error('audio-recorder: pendiente de implementar en Fase 1')
}
