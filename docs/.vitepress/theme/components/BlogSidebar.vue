<script setup>
import { useRoute } from 'vitepress'
import { computed } from 'vue'
import { blogPosts } from '../data/blogPosts'

const route = useRoute()

const currentPath = computed(() => route.path)

const otherPosts = computed(() => {
  return blogPosts.filter(post => !currentPath.value.includes(post.path.replace('/blog/', '')))
})
</script>

<template>
  <div class="blog-sidebar">
    <div class="blog-sidebar-title">More Blog Posts</div>
    <nav class="blog-sidebar-nav">
      <a
        v-for="post in otherPosts"
        :key="post.path"
        :href="post.path"
        class="blog-sidebar-link"
      >
        {{ post.title }}
      </a>
    </nav>
  </div>
</template>

<style scoped>
.blog-sidebar {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.blog-sidebar-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.75rem;
}

.blog-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.blog-sidebar-link {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  line-height: 1.4;
  padding: 0.2rem 0;
  transition: color 0.2s ease;
}

.blog-sidebar-link:hover {
  color: var(--vp-c-brand-1);
}
</style>
