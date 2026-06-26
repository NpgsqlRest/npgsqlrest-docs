<template>
  <button
    type="button"
    class="terminal-play-btn"
    :class="{ paused }"
    :aria-label="paused ? 'Resume animation' : 'Pause animation'"
    :title="paused ? 'Resume animation' : 'Pause animation'"
    :aria-pressed="paused ? 'true' : 'false'"
    @click="$emit('toggle')"
  >
    <svg v-if="paused" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
    <svg v-else viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <rect x="3" y="2.5" width="3.5" height="11" rx="0.8" fill="currentColor" />
      <rect x="9.5" y="2.5" width="3.5" height="11" rx="0.8" fill="currentColor" />
    </svg>
  </button>
</template>

<script setup>
defineProps({
  paused: { type: Boolean, default: false }
})
defineEmits(['toggle'])
</script>

<style scoped>
.terminal-play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 0.5rem;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
}

.terminal-play-btn:hover,
.terminal-play-btn:focus-visible {
  color: #5dd9d1;
  background: rgba(93, 217, 209, 0.12);
  border-color: rgba(93, 217, 209, 0.45);
  outline: none;
}

.terminal-play-btn.paused {
  color: #5dd9d1;
  border-color: rgba(93, 217, 209, 0.35);
}

@media (max-width: 640px) {
  .terminal-play-btn {
    width: 20px;
    height: 20px;
  }
}
</style>
