<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { data } from '../data/githubStars.data'

// Navbar "GitHub ★ count" button.
// The count is baked in at build time (githubStars.data.ts) and refreshed
// in the browser from the public GitHub API (no auth, CORS-enabled, 60 req/h
// per visitor IP), cached in localStorage so page loads don't burn the limit.
// Starring itself can't be done from a static site (it needs a GitHub OAuth
// token), so the button opens the repo page, where Star is one click away;
// when the visitor comes back to this tab the count is re-fetched.

const REPO = 'NpgsqlRest/NpgsqlRest'
const REPO_URL = `https://github.com/${REPO}`
const API_URL = `https://api.github.com/repos/${REPO}`
const CACHE_KEY = `gh-stars:${REPO}`
const CACHE_TTL = 10 * 60 * 1000

const stars = ref<number | null>(data.stars)

const display = computed(() => {
  const n = stars.value
  if (n == null) return 'Star'
  if (n < 1000) return String(n)
  const k = n / 1000
  return (k < 10 ? k.toFixed(1).replace(/\.0$/, '') : String(Math.round(k))) + 'k'
})

const label = computed(() =>
  stars.value == null
    ? 'Star NpgsqlRest on GitHub'
    : `Star NpgsqlRest on GitHub (${stars.value.toLocaleString('en-US')} stars)`
)

async function refresh(force = false) {
  try {
    if (!force) {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && typeof cached.v === 'number' && Date.now() - cached.t < CACHE_TTL) {
        stars.value = cached.v
        return
      }
    }
    const res = await fetch(API_URL, { cache: force ? 'no-cache' : 'default' })
    const json = res.ok ? await res.json() : null
    if (typeof json?.stargazers_count === 'number') stars.value = json.stargazers_count
    // Cache failed lookups too (rate limit, outage) so every page load doesn't retry.
    if (stars.value != null) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ v: stars.value, t: Date.now() }))
    }
  } catch {
    // Offline or storage blocked: keep the build-time value.
  }
}

let leftForGitHub = false
function onClick() {
  leftForGitHub = true
}
function onVisibilityChange() {
  if (leftForGitHub && document.visibilityState === 'visible') {
    leftForGitHub = false
    refresh(true)
  }
}

onMounted(() => {
  refresh()
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <a
    class="gh-stars"
    :href="REPO_URL"
    target="_blank"
    rel="noopener"
    :aria-label="label"
    :title="label"
    @click="onClick"
  >
    <svg class="gh-stars-logo" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
    <span class="gh-stars-count">
      <svg class="gh-stars-star" viewBox="0 0 16 16" aria-hidden="true">
        <path class="outline" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z" />
        <path class="fill" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
      </svg>
      <span class="gh-stars-num">{{ display }}</span>
    </span>
  </a>
</template>

<style scoped>
.gh-stars {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  transition: border-color 0.25s, background-color 0.25s;
}

.gh-stars:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}

.gh-stars-logo {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.gh-stars-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--vp-c-text-2);
  font-variant-numeric: tabular-nums;
  transition: color 0.25s;
}

.gh-stars:hover .gh-stars-count {
  color: var(--vp-c-text-1);
}

.gh-stars-star {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.gh-stars-star .fill {
  display: none;
}

.gh-stars:hover .gh-stars-star {
  color: var(--vp-c-accent-1);
}

.gh-stars:hover .gh-stars-star .outline {
  display: none;
}

.gh-stars:hover .gh-stars-star .fill {
  display: inline;
}

/* Phones: sit left of the search/hamburger icons */
@media (max-width: 767px) {
  .gh-stars {
    order: -1;
  }
}

/* Smallest phones (320px): drop the star glyph, keep logo + count */
@media (max-width: 359px) {
  .gh-stars {
    gap: 5px;
    padding: 0 6px;
    font-size: 12px;
  }

  .gh-stars-logo {
    width: 15px;
    height: 15px;
  }

  .gh-stars-star {
    display: none;
  }
}

/* Tablet: follows the "..." flyout, which has a -12px right margin */
@media (min-width: 768px) {
  .gh-stars {
    margin-left: 16px;
  }
}

/* Desktop: follows the social icons, which have a -8px right margin */
@media (min-width: 1280px) {
  .gh-stars {
    margin-left: 14px;
  }
}
</style>
