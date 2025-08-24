<script setup lang="ts">
import { useRoute } from 'vitepress'
import { computed } from 'vue'
import { blogPosts } from '../data/blogPosts'

interface Link {
  text: string
  href: string
}

interface Props {
  sourceCode?: string
  documentation?: Link[]
  getStarted?: Link[]
}

defineProps<Props>()

const route = useRoute()

const currentPath = computed(() => route.path)

const otherPosts = computed(() => {
  return blogPosts.filter(post => !currentPath.value.includes(post.path.replace('/blog/', '')))
})
</script>

<template>
  <div class="blog-nav">
    <p v-if="sourceCode">
      <strong>Source Code:</strong> <a :href="sourceCode" target="_blank">View the complete example on GitHub</a>
    </p>

    <p v-if="documentation && documentation.length">
      <strong>Documentation:</strong>
      <br />
      <template v-for="(link, index) in documentation" :key="link.href">
        <a :href="link.href">{{ link.text }}</a>
        <span v-if="index < documentation.length - 1"> · </span>
      </template>
    </p>

    <p>
      <strong>More Blog Posts:</strong>
      <br />
      <template v-for="(post, index) in otherPosts" :key="post.path">
        <a :href="post.path">{{ post.title }}</a>
        <span v-if="index < otherPosts.length - 1"> · </span>
      </template>
    </p>

    <p v-if="getStarted && getStarted.length">
      <strong>Get Started:</strong>
      <br />
      <template v-for="(link, index) in getStarted" :key="link.href">
        <a :href="link.href">{{ link.text }}</a>
        <span v-if="index < getStarted.length - 1"> · </span>
      </template>
    </p>
  </div>
</template>

<style scoped>
.blog-nav {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.blog-nav p {
  margin: 0.75rem 0;
  line-height: 1.7;
}

.blog-nav p:first-child {
  margin-top: 0;
}

.blog-nav a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.blog-nav a:hover {
  text-decoration: underline;
}

</style>
