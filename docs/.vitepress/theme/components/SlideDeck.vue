<template>
  <figure
    ref="root"
    class="slide-deck"
    :class="{ 'is-fullscreen': isFullscreen }"
    role="group"
    :aria-label="title || 'Slide presentation'"
  >
    <!-- Header -->
    <div class="sd-header">
      <span class="sd-title">{{ title }}</span>
      <span class="sd-count">{{ current + 1 }} / {{ slides.length }}</span>
    </div>

    <!-- Stage -->
    <div class="sd-stage">
      <img
        :key="current"
        :src="slides[current].src"
        :alt="`Slide ${current + 1}` + (slides[current].alt ? ': ' + slides[current].alt : '')"
        class="sd-image"
        draggable="false"
      />

      <button
        class="sd-edge sd-edge-prev"
        :disabled="current === 0"
        aria-label="Previous slide"
        @click="prev"
      >
        <span>‹</span>
      </button>
      <button
        class="sd-edge sd-edge-next"
        :disabled="current === slides.length - 1"
        aria-label="Next slide"
        @click="next"
      >
        <span>›</span>
      </button>

      <!-- progress bar -->
      <div class="sd-progress">
        <div class="sd-progress-fill" :style="{ width: ((current + 1) / slides.length * 100) + '%' }" />
      </div>
    </div>

    <!-- Controls -->
    <div class="sd-controls">
      <div class="sd-controls-left">
        <button class="sd-btn" aria-label="Previous slide" :disabled="current === 0" @click="prev">‹ Prev</button>
        <button class="sd-btn" aria-label="Next slide" :disabled="current === slides.length - 1" @click="next">Next ›</button>
        <button class="sd-btn" :aria-pressed="playing" :title="playing ? 'Pause autoplay' : 'Play (auto-advance)'" @click="togglePlay">
          {{ playing ? '❚❚' : '►' }}
        </button>
      </div>
      <div class="sd-controls-right">
        <button
          v-if="hasNotes"
          class="sd-btn"
          :class="{ 'sd-btn-active': showNotes }"
          :aria-pressed="showNotes"
          @click="showNotes = !showNotes"
        >
          {{ showNotes ? 'Hide notes' : 'Notes' }}
        </button>
        <button class="sd-btn" :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'" @click="toggleFullscreen">
          {{ isFullscreen ? '⤡ Exit' : '⤢ Fullscreen' }}
        </button>
      </div>
    </div>

    <!-- Speaker notes -->
    <transition name="sd-fade">
      <div v-if="showNotes && currentNotes" class="sd-notes">
        <span class="sd-notes-label">Speaker notes</span>
        <p>{{ currentNotes }}</p>
      </div>
    </transition>

    <!-- Thumbnail strip -->
    <div class="sd-thumbs" ref="thumbStrip">
      <button
        v-for="(s, i) in slides"
        :key="i"
        class="sd-thumb"
        :class="{ 'sd-thumb-active': i === current }"
        :aria-label="`Go to slide ${i + 1}`"
        :aria-current="i === current"
        @click="go(i)"
      >
        <img :src="s.src" :alt="''" loading="lazy" />
        <span class="sd-thumb-num">{{ i + 1 }}</span>
      </button>
    </div>
  </figure>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  slides: { type: Array, required: true },
  title: { type: String, default: 'Presentation' },
  autoplayMs: { type: Number, default: 6000 }
})

const root = ref(null)
const thumbStrip = ref(null)
const current = ref(0)
const showNotes = ref(false)
const playing = ref(false)
const isFullscreen = ref(false)
let timer = null

const hasNotes = computed(() => props.slides.some(s => s.notes))
const currentNotes = computed(() => props.slides[current.value]?.notes || '')

function clamp(i) {
  return Math.max(0, Math.min(props.slides.length - 1, i))
}
function go(i) {
  current.value = clamp(i)
}
function next() {
  if (current.value < props.slides.length - 1) current.value++
  else if (playing.value) current.value = 0 // loop while autoplaying
}
function prev() {
  current.value = clamp(current.value - 1)
}

// --- autoplay ---
function togglePlay() {
  playing.value = !playing.value
}
watch(playing, (on) => {
  clearInterval(timer)
  if (on) timer = setInterval(next, props.autoplayMs)
})

// --- preload neighbours + keep active thumb in view ---
watch(current, (i) => {
  ;[i - 1, i + 1].forEach((n) => {
    const s = props.slides[n]
    if (s) {
      const img = new Image()
      img.src = s.src
    }
  })
  nextTick(() => {
    const strip = thumbStrip.value
    const active = strip?.children?.[i]
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  })
})

// --- keyboard ---
function onKey(e) {
  // only when the deck is focused/hovered region or fullscreen
  if (!root.value) return
  const active = isFullscreen.value || root.value.contains(document.activeElement) || hovering
  if (!active) return
  switch (e.key) {
    case 'ArrowRight':
    case ' ':
    case 'PageDown':
      e.preventDefault(); next(); break
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault(); prev(); break
    case 'Home':
      e.preventDefault(); go(0); break
    case 'End':
      e.preventDefault(); go(props.slides.length - 1); break
    case 'f': case 'F':
      toggleFullscreen(); break
    case 'n': case 'N':
      if (hasNotes.value) showNotes.value = !showNotes.value; break
  }
}

let hovering = false
function onEnter() { hovering = true }
function onLeave() { hovering = false }

// --- fullscreen ---
function toggleFullscreen() {
  const el = root.value
  if (!document.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {})
  } else {
    document.exitFullscreen?.()
  }
}
function onFsChange() {
  isFullscreen.value = document.fullscreenElement === root.value
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFsChange)
  root.value?.addEventListener('mouseenter', onEnter)
  root.value?.addEventListener('mouseleave', onLeave)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFsChange)
  root.value?.removeEventListener('mouseenter', onEnter)
  root.value?.removeEventListener('mouseleave', onLeave)
})
</script>

<style scoped>
.slide-deck {
  margin: 2rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

/* header */
.sd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.9rem;
  font-size: 0.78rem;
  border-bottom: 1px solid var(--vp-c-divider);
}
.sd-title { font-weight: 600; color: var(--vp-c-text-1); }
.sd-count { color: var(--vp-c-text-2); font-variant-numeric: tabular-nums; font-family: var(--vp-font-family-mono, monospace); }

/* stage */
.sd-stage {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sd-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: sd-in 0.28s ease;
  user-select: none;
}
@keyframes sd-in { from { opacity: 0; } to { opacity: 1; } }

.sd-edge {
  position: absolute;
  top: 0;
  height: 100%;
  width: 18%;
  max-width: 110px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 3rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  display: flex;
  align-items: center;
}
.sd-edge-prev { left: 0; justify-content: flex-start; padding-left: 0.5rem; }
.sd-edge-next { right: 0; justify-content: flex-end; padding-right: 0.5rem; }
.sd-stage:hover .sd-edge:not(:disabled) { opacity: 0.85; }
.sd-edge:not(:disabled):hover { background: linear-gradient(90deg, rgba(0,0,0,0.4), transparent); }
.sd-edge-next:not(:disabled):hover { background: linear-gradient(270deg, rgba(0,0,0,0.4), transparent); }
.sd-edge:disabled { cursor: default; opacity: 0 !important; }
.sd-edge span { text-shadow: 0 1px 6px rgba(0,0,0,0.6); }

.sd-progress {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 3px;
  background: rgba(255,255,255,0.15);
}
.sd-progress-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  transition: width 0.3s ease;
}

/* controls */
.sd-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border-top: 1px solid var(--vp-c-divider);
  flex-wrap: wrap;
}
.sd-controls-left, .sd-controls-right { display: flex; gap: 0.4rem; }
.sd-btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  white-space: nowrap;
}
.sd-btn:hover:not(:disabled) { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.sd-btn:disabled { opacity: 0.4; cursor: default; }
.sd-btn-active { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

/* notes */
.sd-notes {
  padding: 0.9rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-size: 0.92rem;
  line-height: 1.6;
}
.sd-notes-label {
  display: block;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  margin-bottom: 0.35rem;
}
.sd-notes p { margin: 0; color: var(--vp-c-text-1); }

/* thumbnails */
.sd-thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 0.7rem;
  overflow-x: auto;
  border-top: 1px solid var(--vp-c-divider);
  scrollbar-width: thin;
}
.sd-thumb {
  position: relative;
  flex: 0 0 auto;
  width: 92px;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 5px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
  opacity: 0.55;
  transition: opacity 0.2s, border-color 0.2s;
}
.sd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sd-thumb:hover { opacity: 0.9; }
.sd-thumb-active { opacity: 1; border-color: var(--vp-c-brand-1); }
.sd-thumb-num {
  position: absolute;
  bottom: 2px; right: 3px;
  font-size: 0.6rem;
  background: rgba(0,0,0,0.65);
  color: #fff;
  padding: 0 4px;
  border-radius: 3px;
  font-family: var(--vp-font-family-mono, monospace);
}

/* fullscreen */
.slide-deck.is-fullscreen {
  display: flex;
  flex-direction: column;
  width: 100vw; height: 100vh;
  margin: 0; border-radius: 0;
  background: #000;
}
.is-fullscreen .sd-stage { flex: 1; aspect-ratio: auto; min-height: 0; }
.is-fullscreen .sd-header { background: #0a0a0a; color: #fff; }
.is-fullscreen .sd-header .sd-title { color: #fff; }

/* transitions */
.sd-fade-enter-active, .sd-fade-leave-active { transition: opacity 0.2s; }
.sd-fade-enter-from, .sd-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .sd-edge { display: none; }
  .sd-thumb { width: 64px; }
  .sd-btn { padding: 0.3rem 0.55rem; }
}
</style>
