<script setup>
// Pantalla final: anónimo vs identificado.
// v-model:anonymous (boolean) + v-model:name (string).
defineProps({
  anonymous: { type: Boolean, default: true },
  name: { type: String, default: '' },
})
const emit = defineEmits(['update:anonymous', 'update:name'])
</script>

<template>
  <div class="identity">
    <div class="options">
      <button
        type="button"
        :class="['opt', { active: anonymous }]"
        @click="emit('update:anonymous', true)"
      >
        <strong>Anónimo</strong>
        <span>No se guarda tu nombre</span>
      </button>
      <button
        type="button"
        :class="['opt', { active: !anonymous }]"
        @click="emit('update:anonymous', false)"
      >
        <strong>Con mi nombre</strong>
        <span>Para dar seguimiento personal</span>
      </button>
    </div>

    <input
      v-if="!anonymous"
      :value="name"
      type="text"
      class="name-input"
      placeholder="Tu nombre"
      @input="emit('update:name', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.identity {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.options {
  display: flex;
  gap: 12px;
}
.opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--border-strong);
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.opt strong {
  color: var(--text);
  font-size: 1rem;
}
.opt span {
  color: var(--text-muted);
  font-size: 0.82rem;
}
.opt:hover {
  border-color: var(--accent);
}
.opt.active {
  border-color: var(--accent);
  background: var(--accent-bg);
}
.name-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}
.name-input:focus {
  outline: none;
  border-color: var(--accent);
}
@media (max-width: 600px) {
  .options {
    flex-direction: column;
  }
}
</style>
