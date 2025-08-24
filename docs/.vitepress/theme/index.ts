import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { h, nextTick, watch } from 'vue'
import { useData, useRoute } from 'vitepress'
import type { Theme } from 'vitepress'
import { createMermaidRenderer } from 'vitepress-mermaid-renderer'
import Chatbot from './components/Chatbot.vue'
import ClaudeBadge from './components/ClaudeBadge.vue'
import BlogSidebar from './components/BlogSidebar.vue'
import BlogNav from './components/BlogNav.vue'
import GiscusComments from './components/GiscusComments.vue'
import CommentsOutlineLink from './components/CommentsOutlineLink.vue'
import SponsorFooter from './components/SponsorFooter.vue'
import AsciiLogo from './components/AsciiLogo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register global components that can be used in markdown
    app.component('BlogNav', BlogNav)
  },
  Layout() {
    const { frontmatter, isDark } = useData()
    const route = useRoute()
    const isBlogPage = route.path.startsWith('/blog/')
    const isDocPage = /^\/(annotations|changelog|config|examples|guide|reference|blog)\//.test(route.path)

    const initMermaid = () => {
      createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'default',
      })
    }

    // Initial mermaid setup
    nextTick(() => initMermaid())

    // On theme change, re-render mermaid charts
    watch(
      () => isDark.value,
      () => {
        initMermaid()
      }
    )

    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => frontmatter.value.layout === 'home' ? h(AsciiLogo) : null,
      'layout-bottom': () => frontmatter.value.layout === 'home' ? h(Chatbot) : null,
      'doc-before': () => h(ClaudeBadge),
      'aside-outline-after': () => isBlogPage
        ? [h(CommentsOutlineLink), h(BlogSidebar)]
        : isDocPage ? h(CommentsOutlineLink) : null,
      'doc-after': () => isDocPage ? [h(GiscusComments), h(SponsorFooter)] : null
    })
  }
}