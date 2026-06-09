<script setup>
// Pantalla 1: bienvenida (un solo QR, sin ubicación).
// Animación on-brand: en la parte de abajo, un tráiler SEGA (SVG) cruza la
// carretera y se detiene. El contenido se revela con un fade sutil.
// Respeta prefers-reduced-motion.
const emit = defineEmits(['start'])
</script>

<template>
  <div class="welcome">
    <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo reveal" />
    <h1 class="reveal">Tu opinión cuenta</h1>
    <p class="lead reveal">
      Cuéntanos cómo te sientes trabajando en <strong>SEGA Carriers</strong>.
      Es anónimo y toma menos de 2 minutos.
    </p>
    <button type="button" class="start-btn reveal" @click="emit('start')">
      Comenzar
    </button>

    <!-- Escena de la carretera (abajo): tráiler que entra desde la izquierda -->
    <div class="road-scene" aria-hidden="true">
      <svg class="truck" viewBox="0 0 132 54" xmlns="http://www.w3.org/2000/svg">
        <!-- caja / tráiler -->
        <rect x="3" y="6" width="78" height="30" rx="2.5"
              fill="#eef1f5" stroke="#16181d" stroke-width="2" />
        <line x1="69" y1="8" x2="69" y2="34" stroke="#cbd5e1" stroke-width="1.5" />
        <!-- escape -->
        <line x1="84" y1="3" x2="84" y2="14" stroke="#16181d" stroke-width="2.5" stroke-linecap="round" />
        <!-- cabina (sleeper) -->
        <rect x="82" y="12" width="17" height="24" rx="2.5"
              fill="#e63329" stroke="#16181d" stroke-width="2" />
        <!-- cofre / hood -->
        <path d="M99 22 h20 a4 4 0 0 1 4 4 v10 h-24 z"
              fill="#e63329" stroke="#16181d" stroke-width="2" />
        <!-- parabrisas -->
        <rect x="90" y="15" width="8" height="9" rx="1.2"
              fill="#bfe0f5" stroke="#16181d" stroke-width="1.5" />
        <!-- faro y defensa -->
        <rect x="120" y="27" width="3" height="4" rx="1" fill="#ffd24a" />
        <rect x="121" y="33" width="3" height="4" fill="#16181d" />
        <!-- ruedas -->
        <g fill="#1f2430">
          <circle cx="24" cy="40" r="7.5" />
          <circle cx="42" cy="40" r="7.5" />
          <circle cx="108" cy="40" r="7.5" />
        </g>
        <g fill="#cbd5e1">
          <circle cx="24" cy="40" r="2.6" />
          <circle cx="42" cy="40" r="2.6" />
          <circle cx="108" cy="40" r="2.6" />
        </g>
      </svg>
      <span class="road"></span>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 24px 8px 8px;
}

/* ── Contenido (revelado con fade) ──────────────────────── */
.reveal {
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

/* ── Escena de la carretera (abajo) ─────────────────────── */
.road-scene {
  position: relative;
  width: 100%;
  height: 66px;
  margin-top: 14px;
  overflow: hidden;
}
.truck {
  position: absolute;
  bottom: 12px;
  left: 50%;
  width: 132px;
  height: auto;
  transform: translateX(-50%);
  animation: drive-in 1.7s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.road {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-strong);
  border-radius: 2px;
}
.road::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    var(--text-faint) 0 14px,
    transparent 14px 28px
  );
  opacity: 0.5;
  animation: road-move 0.5s linear 4;
}

@keyframes drive-in {
  from {
    transform: translateX(-340px);
    opacity: 0;
  }
  45% {
    opacity: 1;
  }
  to {
    transform: translateX(-50%);
  }
}
@keyframes road-move {
  to {
    background-position: -28px 0;
  }
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

/* Sin animaciones: tráiler centrado y contenido visible de inmediato. */
@media (prefers-reduced-motion: reduce) {
  .truck,
  .road::before,
  .reveal {
    animation: none;
  }
}
</style>
