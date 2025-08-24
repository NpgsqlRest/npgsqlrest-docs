<template>
  <div class="ascii-logo-wrapper">
    <pre class="ascii-logo" aria-label="NpgsqlRest">
    _   __                   __  ____            __
   / | / /___  ____ ________/ / / __ \___  _____/ /_
  /  |/ / __ \/ __ `/ ___/ __ \/ /_/ / _ \/ ___/ __/
 / /|  / /_/ / /_/ (__  ) /_/ / _, _/  __(__  ) /_
/_/ |_/ .___/\__, /____/\__, /_/ |_|\___/____/\__/
     /_/    /____/        /_/
</pre>
  </div>
</template>

<style scoped>
.ascii-logo-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.ascii-logo {
  font-family: 'Courier New', Courier, monospace;
  font-size: clamp(0.55rem, 1.4vw, 0.85rem);
  line-height: 1.3;
  font-weight: bold;
  color: var(--vp-c-brand-1);
  white-space: pre;
  text-align: left;
  margin: 0;
  padding: 1rem 0;
  width: fit-content;
  text-shadow:
    0 0 7px var(--vp-c-brand-1),
    0 0 20px var(--vp-c-brand-2),
    0 0 40px var(--vp-c-brand-3);
}

@media (max-width: 959px) {
  .ascii-logo-wrapper {
    padding-top: 4rem;
    overflow: visible;
  }
}
</style>
