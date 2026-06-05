<script setup>
// Pantalla de agradecimiento tras enviar la encuesta.
</script>

<template>
  <main class="thanks">
    <div class="card">
      <img src="/logo-sega.jpeg" alt="SEGA Carriers" class="logo" />
      <div class="check">✓</div>
      <h1>¡Gracias por tu opinión!</h1>
      <p>Tu respuesta nos ayuda a hacer de SEGA un mejor lugar para trabajar.</p>
    </div>
  </main>
</template>

<style scoped>
.thanks {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.card {
  max-width: 480px;
  width: 100%;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 40px 28px;
  text-align: center;
}
.logo {
  width: 140px;
  height: auto;
  margin-bottom: 8px;
}
.check {
  width: 64px;
  height: 64px;
  margin: 8px auto 16px;
  border-radius: 50%;
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
h1 {
  color: var(--ink);
  font-size: 1.5rem;
  margin-bottom: 10px;
}
p {
  color: var(--text-muted);
  line-height: 1.55;
}
</style>
