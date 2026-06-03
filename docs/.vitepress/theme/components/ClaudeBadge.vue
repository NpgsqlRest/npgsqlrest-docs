<script setup>
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'

const { frontmatter } = useData()
const route = useRoute()

const isHumanWritten = computed(() => {
  return frontmatter.value.badge === 'human'
})

const isBlogPost = computed(() => {
  const path = route.path
  return path.startsWith('/blog/') && path !== '/blog/' && path !== '/blog/index.html'
})

const showAttentionNotice = computed(() => isBlogPost.value && !isHumanWritten.value)
</script>

<template>
  <div class="claude-badge">
    <a
      v-if="isHumanWritten"
      href="https://www.linkedin.com/in/vb-software/"
      target="_blank"
      title="Human Written"
    >
      <img src="https://img.shields.io/badge/Human-Written-blue" alt="Human Written">
    </a>
    <a
      v-else
      href="/about"
      title="AI-assisted, verified against source"
    >
      <img src="https://img.shields.io/badge/AI--assisted-verified_against_source-cc785c?logo=anthropic" alt="AI-assisted, verified against source">
    </a>
    <details v-if="showAttentionNotice" class="attention-notice">
      <summary>How this page was made</summary>
      <p>
        This page was written with AI assistance and verified against the NpgsqlRest source code —
        the same division of labor the product itself is built around: AI does the writing, machines
        check the facts. The project itself (the library, parser, codegen, and runtime) is hand-written
        and covered by 2,200+ integration tests. A few posts written entirely by hand carry a
        "Human Written" badge instead. If you spot an inaccuracy, the comment section below goes
        straight to the maintainer — more in <a href="/about">About</a>.
      </p>
    </details>
  </div>
</template>

<style scoped>
.claude-badge {
  margin-bottom: 24px;
  text-align: center;
}

.attention-notice {
  margin-top: 16px;
  padding: 16px 20px;
  border-radius: 8px;
  background-color: var(--vp-custom-block-tip-bg);
  border: 1px solid var(--vp-custom-block-tip-border);
  text-align: left;
}

.attention-notice summary {
  font-weight: 700;
  cursor: pointer;
  color: var(--vp-custom-block-tip-text);
}

.attention-notice p {
  margin: 12px 0 0 0;
  line-height: 1.7;
  color: var(--vp-custom-block-tip-text);
}
</style>
