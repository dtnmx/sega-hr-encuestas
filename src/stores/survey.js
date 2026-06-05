import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { extensionForMime } from '../lib/audio-recorder'

const AUDIO_BUCKET = 'survey-audios'
// Secciones que pueden llevar nota de voz → columna *_audio_url.
const AUDIO_SECTIONS = ['jefatura', 'companeros', 'seguridad', 'instalaciones', 'propuesta']

// Estado del formulario público en progreso (las pantallas del flujo).
function emptyAudios() {
  return { jefatura: null, companeros: null, seguridad: null, instalaciones: null, propuesta: null }
}

function emptyForm() {
  return {
    is_anonymous: true,
    employee_name: '',

    // 1. Jefatura inmediata
    jefatura_comunicacion: null,
    jefatura_trato: null,
    jefatura_apoyo: null,
    jefatura_comentario: '',

    // 2. Compañeros
    companeros_equipo: null,
    companeros_respeto: null,
    companeros_ambiente: null,
    companeros_comentario: '',

    // 3. Seguridad
    seguridad_nivel: null,
    seguridad_comentario: '',

    // 4. Instalaciones
    instalaciones_estado: null,
    instalaciones_limpieza: null,
    instalaciones_comodidad: null,
    instalaciones_comentario: '',

    // 5. Propuesta libre
    propuesta_libre: '',

    // 6. Importancia relativa (top 2)
    importancia_top: [],
  }
}

export const useSurveyStore = defineStore('survey', {
  state: () => ({
    form: emptyForm(),
    audios: emptyAudios(), // { section: Blob | null }
    step: 0,
    submitting: false,
  }),

  actions: {
    reset() {
      this.form = emptyForm()
      this.audios = emptyAudios()
      this.step = 0
    },

    // Construye el payload limpio para survey_responses.
    buildPayload() {
      const f = this.form
      return {
        is_anonymous: f.is_anonymous,
        employee_name: f.is_anonymous ? null : f.employee_name.trim() || null,

        jefatura_comunicacion: f.jefatura_comunicacion,
        jefatura_trato: f.jefatura_trato,
        jefatura_apoyo: f.jefatura_apoyo,
        jefatura_comentario: f.jefatura_comentario.trim() || null,

        companeros_equipo: f.companeros_equipo,
        companeros_respeto: f.companeros_respeto,
        companeros_ambiente: f.companeros_ambiente,
        companeros_comentario: f.companeros_comentario.trim() || null,

        seguridad_nivel: f.seguridad_nivel,
        seguridad_comentario: f.seguridad_comentario.trim() || null,

        instalaciones_estado: f.instalaciones_estado,
        instalaciones_limpieza: f.instalaciones_limpieza,
        instalaciones_comodidad: f.instalaciones_comodidad,
        instalaciones_comentario: f.instalaciones_comentario.trim() || null,

        propuesta_libre: f.propuesta_libre.trim() || null,
        importancia_top: f.importancia_top,

        user_agent: navigator.userAgent,
      }
    },

    async submit() {
      this.submitting = true
      try {
        // UUID local: sirve de id de la fila y de carpeta en Storage.
        const id =
          crypto.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(16).slice(2)}`

        // Subir las notas de voz al bucket privado: {id}/{section}.{ext}
        const audioUrls = {}
        for (const section of AUDIO_SECTIONS) {
          const blob = this.audios[section]
          if (!blob) continue
          const ext = extensionForMime(blob.type)
          const path = `${id}/${section}.${ext}`
          const { error: upErr } = await supabase.storage
            .from(AUDIO_BUCKET)
            .upload(path, blob, {
              contentType: blob.type || 'audio/webm',
              upsert: false,
            })
          if (upErr) throw upErr
          audioUrls[`${section}_audio_url`] = path
        }

        const { error } = await supabase
          .from('survey_responses')
          .insert({ id, ...this.buildPayload(), ...audioUrls })
        if (error) throw error
      } finally {
        this.submitting = false
      }
    },
  },
})
