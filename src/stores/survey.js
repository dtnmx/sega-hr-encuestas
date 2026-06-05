import { defineStore } from 'pinia'

// Estado del formulario público en progreso (las 6 pantallas).
// TODO (Fase 1): modelar ratings 1-5 por área, comentarios, audios,
// importancia top-2, identidad, y la acción submit() que sube audios
// + inserta en survey_responses.
export const useSurveyStore = defineStore('survey', {
  state: () => ({
    location: null, // code de locations (?loc=...)
    step: 0,
  }),
})
