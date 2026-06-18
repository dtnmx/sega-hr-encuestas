import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

// Sesión de Cecilia / admins (Supabase Auth).
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    // Restaura la sesión persistida y se suscribe a cambios. Llamar una vez al arrancar.
    async init() {
      const { data } = await supabase.auth.getSession()
      this.user = data.session?.user ?? null
      this.loading = false
      supabase.auth.onAuthStateChange((_event, session) => {
        this.user = session?.user ?? null
      })
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      this.user = data.user
    },

    async signOut() {
      await supabase.auth.signOut()
      this.user = null
    },

    // Cambia la contraseña del usuario autenticado (no requiere correo/SMTP:
    // basta la sesión activa). El temporal lo cambia el propio admin al entrar.
    async updatePassword(newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
  },
})
