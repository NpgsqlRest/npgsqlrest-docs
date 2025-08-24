<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import Giscus from '@giscus/vue'

const { isDark } = useData()
const route = useRoute()

const theme = computed(() => isDark.value ? 'dark' : 'light')
const term = computed(() => route.path)
</script>

<template>
  <div id="comments" class="giscus-wrapper">
    <h2 class="comments-heading">Comments</h2>
    <Giscus
      repo="NpgsqlRest/npgsqlrest-docs"
      repo-id="R_kgDOPjTHtg"
      category="Comments"
      category-id="DIC_kwDOPjTHts4C05oC"
      mapping="pathname"
      :term="term"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      :theme="theme"
      lang="en"
      loading="lazy"
    />
  </div>
</template>

<style scoped>
.giscus-wrapper {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.comments-heading {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--vp-c-text-1);
}
</style>
