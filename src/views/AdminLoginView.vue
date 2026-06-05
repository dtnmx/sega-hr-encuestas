<script setup>
// Login de admins (Supabase Auth, email + password).
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value.trim(), password.value)
    router.push(route.query.redirect || { name: 'admin-dashboard' })
  } catch (e) {
    error.value = 'Correo o contraseña incorrectos.'
    console.error('[login]', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="onSubmit">
      <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo" />
      <h1>Panel de resultados</h1>
      <p class="muted">Acceso para administradores</p>

      <label>
        Correo
        <input v-model="email" type="email" autocomplete="username" required placeholder="tucorreo@segacarriers.com" />
      </label>
      <label>
        Contraseña
        <input v-model="password" type="password" autocomplete="current-password" required placeholder="••••••••" />
      </label>

      <button type="submit" class="btn" :disabled="loading">
        {{ loading ? 'Entrando…' : 'Entrar' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.logo {
  width: 120px;
  height: auto;
  align-self: center;
}
h1 {
  font-size: 1.3rem;
  color: var(--ink);
  text-align: center;
  margin: 0;
}
.muted {
  color: var(--text-muted);
  text-align: center;
  font-size: 0.9rem;
  margin: 0 0 8px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
input {
  padding: 11px 13px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  font-size: 0.95rem;
  font-family: inherit;
}
input:focus {
  outline: none;
  border-color: var(--accent);
}
.btn {
  margin-top: 8px;
  padding: 13px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn:hover {
  background: var(--accent-dark);
}
.btn:disabled {
  background: var(--text-faint);
  cursor: not-allowed;
}
.error {
  color: var(--danger);
  text-align: center;
  font-size: 0.88rem;
  margin: 0;
}
</style>
