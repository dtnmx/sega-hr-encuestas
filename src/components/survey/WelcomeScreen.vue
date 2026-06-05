<script setup>
// Pantalla 1: bienvenida con el nombre legible de la ubicación.
defineProps({
  locationName: { type: String, default: 'SEGA' },
})
const emit = defineEmits(['start'])
</script>

<template>
  <div class="welcome">
    <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo" />
    <h1>Tu opinión cuenta</h1>
    <p class="lead">
      Cuéntanos cómo te sientes trabajando en <strong>{{ locationName }}</strong>.
      Es anónimo y toma menos de 2 minutos.
    </p>
    <button type="button" class="start-btn" @click="emit('start')">
      Comenzar
    </button>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 24px 8px;
}
.logo {
  width: 160px;
  height: auto;
  object-fit: contain;
}
h1 {
  font-size: 1.6rem;
  color: var(--ink);
}
.lead {
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.55;
  max-width: 36ch;
}
.start-btn {
  margin-top: 8px;
  padding: 14px 36px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.start-btn:hover {
  background: var(--accent-dark);
}
</style>
