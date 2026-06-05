// Wrapper de MediaRecorder para grabar respuestas de voz.
// Formato objetivo: audio/webm; codecs=opus (~24 kbps, máx 60 s — ver .md §4).
// Si el navegador no soporta webm/opus (p. ej. Safari), cae al mejor mime
// disponible (mp4/ogg). El componente decide el límite de duración.

export function isRecordingSupported() {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof window !== 'undefined' &&
    'MediaRecorder' in window
  )
}

// Devuelve el primer mime soportado (o '' para que MediaRecorder use su default).
export function pickAudioMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return ''
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) || ''
}

// Extensión de archivo según el mime grabado (para el nombre en Storage).
export function extensionForMime(mime = '') {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4')) return 'm4a'
  return 'webm'
}

export function createRecorder() {
  let stream = null
  let recorder = null
  let chunks = []

  async function start() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    const mimeType = pickAudioMime()
    recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: 24000,
    })
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    recorder.start()
  }

  // Detiene y resuelve con el Blob grabado.
  function stop() {
    return new Promise((resolve, reject) => {
      if (!recorder) {
        reject(new Error('No hay grabación activa'))
        return
      }
      recorder.onstop = () => {
        const type = chunks[0]?.type || pickAudioMime() || 'audio/webm'
        const blob = new Blob(chunks, { type })
        cleanup()
        resolve(blob)
      }
      try {
        recorder.stop()
      } catch (e) {
        cleanup()
        reject(e)
      }
    })
  }

  // Aborta sin producir Blob (libera el micrófono).
  function cancel() {
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop()
    } catch {
      /* noop */
    }
    cleanup()
  }

  function cleanup() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
    recorder = null
  }

  return { start, stop, cancel }
}
