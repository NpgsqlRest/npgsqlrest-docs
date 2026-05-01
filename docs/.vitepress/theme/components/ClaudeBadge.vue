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
      href="https://claude.ai"
      target="_blank"
      title="Written with Claude"
    >
      <img src="https://img.shields.io/badge/written_with-Claude-cc785c?logo=anthropic" alt="Written with Claude">
    </a>
    <details v-if="showAttentionNotice" class="attention-notice">
      <summary>IMPORTANT</summary>
      <p>
        As you may notice, this page and pretty much the entire website were obviously created with the help of AI.
        I wonder how you could tell? Was it a big "Written With Claude" badge on every page?
        I moved it to the top now (with the help of AI of course) to make it even more obvious.
        There are a few blogposts that were written by me manually, the old-fashioned way, I hope there will be more in the future,
        and those have a similar "Human Written" badge.
        This project (not the website), on the other hand, is a very, very different story.
        It took me more than two years of painstaking and unpaid work in my own free time.
        A story that, hopefully, I will tell someday. But meanwhile, what would you like me to do?
        To create a complex documentation website with a bunch of highly technical articles
        with the help of AI and fake it, to give you an illusion that I also did that manually?
        Like half of the internet is doing at this point? How does that make any sense? Is that even fair to you?
        Or maybe to create this website manually, the old-fashioned way, just for you?
        While working a paid job for a salary, most of you wouldn't even get up in the morning.
        Would you like me to sing you a song while we're at it? For your personal entertainment?
        Seriously, get a grip.
        Do you find this information less valuable because of the way this website was created?
        I give my best to fix it to keep the information as accurate as possible, and I think it is very accurate at this point.
        If you find some mistakes, inaccuracies or problems, there is a comment section at the bottom of every page,
        which I also made with the help of the AI. And I would very much appreciate if you leave your feedback there.
        Look, I'm just a guy who likes SQL, that's all.
        If you don't approve of how this website was constructed and the use of AI tools,
        I suggest closing this page and never ever coming back. And good riddance.
        And I would ban your access if I could know how. Thank you for your attention to this matter.
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
