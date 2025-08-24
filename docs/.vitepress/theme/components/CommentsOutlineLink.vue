<script setup lang="ts">
</script>

<template>
  <div class="comments-outline-link">
    <a href="#comments" class="outline-link">Comments</a>
  </div>
</template>

<style scoped>
.comments-outline-link {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.outline-link {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: color 0.25s;
  line-height: 28px;
}

.outline-link:hover {
  color: var(--vp-c-text-1);
}
</style>
