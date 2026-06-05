<script setup>
// Pantalla 1: bienvenida (un solo QR, sin ubicación).
const emit = defineEmits(['start'])
</script>

<template>
  <div class="welcome">
    <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo" />
    <h1>Tu opinión cuenta</h1>
    <p class="lead">
      Cuéntanos cómo te sientes trabajando en <strong>SEGA Carriers</strong>.
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
.welcome > * {
  animation: fade-up 0.5s ease both;
}
.logo {
  width: 160px;
  height: auto;
  object-fit: contain;
  animation-delay: 0.05s;
}
h1 {
  font-size: 1.6rem;
  color: var(--ink);
  animation-delay: 0.15s;
}
.lead {
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.55;
  max-width: 36ch;
  animation-delay: 0.25s;
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
  transition: background 0.2s, transform 0.15s;
  animation-delay: 0.35s;
}
.start-btn:hover {
  background: var(--accent-dark);
}
.start-btn:active {
  transform: scale(0.97);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .welcome > * {
    animation: none;
  }
}
</style>
