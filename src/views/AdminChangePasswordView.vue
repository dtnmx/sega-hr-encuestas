<script setup>
// Cambio de contraseña para el admin ya autenticado (sin correo/SMTP).
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const password = ref('')
const confirm = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  try {
    await auth.updatePassword(password.value)
    success.value = true
    password.value = ''
    confirm.value = ''
  } catch (e) {
    error.value = 'No se pudo cambiar la contraseña. Intenta de nuevo.'
    console.error('[change-password]', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="pwd-page">
    <form class="pwd-card" @submit.prevent="onSubmit">
      <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo" />
      <h1>Cambiar contraseña</h1>
      <p class="muted">{{ auth.user?.email }}</p>

      <template v-if="!success">
        <label>
          Nueva contraseña
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            placeholder="Mínimo 8 caracteres"
          />
        </label>
        <label>
          Confirmar contraseña
          <input
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            required
            placeholder="••••••••"
          />
        </label>

        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Guardando…' : 'Guardar contraseña' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </template>

      <template v-else>
        <p class="ok">✅ Contraseña actualizada correctamente.</p>
      </template>

      <button type="button" class="link" @click="router.push({ name: 'admin-dashboard' })">
        ← Volver al panel
      </button>
    </form>
  </main>
</template>

<style scoped>
.pwd-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.pwd-card {
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
.ok {
  color: var(--text);
  text-align: center;
  font-size: 0.95rem;
  margin: 6px 0;
}
.link {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  align-self: center;
  margin-top: 4px;
}
</style>
