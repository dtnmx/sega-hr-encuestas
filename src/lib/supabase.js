import { createClient } from '@supabase/supabase-js'

// Cliente Supabase singleton.
// Las credenciales viven en .env.local (ver .env.local.example).
// El frontend usa la anon key (pública); RLS es lo que protege los datos.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.local.example a .env.local y rellena las credenciales.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
