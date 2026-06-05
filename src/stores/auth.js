import { defineStore } from 'pinia'

// Sesión de Cecilia / admins (Supabase Auth).
// TODO (Fase 1): signIn/signOut, restaurar sesión persistida,
// exponer `user` y usarlo en el guard de /admin/*.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
})
