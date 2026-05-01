<template>
  <div class="code-terminal" :aria-label="ariaLabel">
    <div class="terminal-chrome">
      <span class="dot dot-red"></span>
      <span class="dot dot-yellow"></span>
      <span class="dot dot-green"></span>
      <span class="terminal-title">{{ frameTitle }}</span>
    </div>
    <div class="terminal-body" :class="{ fading }" :style="bodyStyle">
      <template v-for="(block, bi) in completedBlocks" :key="'c' + bi">
        <div class="line">
          <span class="prompt">$</span>
          <span class="cmd">{{ block.command }}</span>
        </div>
        <div v-for="(l, i) in block.lines" :key="'cl' + bi + '_' + i" class="line response" :class="l.cls">{{ l.text || ' ' }}</div>
      </template>

      <template v-if="sub === 'typing' || sub === 'output'">
        <div class="line">
          <span class="prompt">$</span>
          <span class="cmd">{{ currentCmd }}</span><span v-if="sub === 'typing'" class="cursor">▌</span>
        </div>
        <div v-for="(l, i) in currentLines" :key="'al' + i" class="line response" :class="l.cls">{{ l.text || ' ' }}</div>
      </template>

      <div v-if="sub === 'idle'" class="line">
        <span class="prompt">$</span>
        <span class="cursor">▌</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: { type: String, default: '~ npgsqlrest' },
  ariaLabel: { type: String, default: 'Animated terminal showing code, request, and generated client' },
  frames: { type: Array, required: true },
  idleMs: { type: Number, default: 3200 },
  loopMs: { type: Number, default: 5000 },
  typingMs: { type: Number, default: 22 },
  outputMs: { type: Number, default: 55 },
  blockPauseMs: { type: Number, default: 700 }
})

const idx = ref(0)
const completedBlocks = ref([])
const currentCmd = ref('')
const currentLines = ref([])
const sub = ref('typing')
const fading = ref(false)

function normalizeFrame(frame) {
  if (!frame) return { blocks: [] }
  if (frame.blocks) return frame
  return { ...frame, blocks: [{ command: frame.command, lines: frame.lines, lineMs: frame.lineMs }] }
}

const frameTitle = computed(() => normalizeFrame(props.frames[idx.value]).title || props.title)

const maxLines = computed(() => {
  let max = 0
  for (const f of props.frames) {
    const nf = normalizeFrame(f)
    let n = 1
    for (const b of nf.blocks) {
      n += 1 + (b.lines?.length || 0)
    }
    if (n > max) max = n
  }
  return max
})

const bodyStyle = computed(() => ({
  minHeight: `calc(${maxLines.value} * 1.55em + 2.2rem)`
}))

const timers = []
const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()) }
const schedule = (fn, ms) => timers.push(setTimeout(fn, ms))

function typeOut(text, onDone) {
  let i = 0
  const step = () => {
    if (i >= text.length) return onDone()
    currentCmd.value = text.slice(0, i + 1)
    i++
    schedule(step, props.typingMs + Math.random() * props.typingMs)
  }
  step()
}

function streamLines(lines, perLineMs, onDone) {
  let i = 0
  const step = () => {
    if (i >= lines.length) return onDone()
    currentLines.value = [...currentLines.value, lines[i]]
    i++
    schedule(step, perLineMs)
  }
  step()
}

function runBlock(blockIdx, frame) {
  if (blockIdx >= frame.blocks.length) {
    sub.value = 'idle'
    const isLast = idx.value === props.frames.length - 1
    const wait = isLast ? props.loopMs : props.idleMs
    schedule(() => {
      fading.value = true
      schedule(() => runFrame(isLast ? 0 : idx.value + 1), 240)
    }, wait)
    return
  }

  const block = frame.blocks[blockIdx]
  currentCmd.value = ''
  currentLines.value = []
  sub.value = 'typing'

  typeOut(block.command, () => {
    schedule(() => {
      sub.value = 'output'
      streamLines(block.lines || [], block.lineMs || props.outputMs, () => {
        completedBlocks.value.push({
          command: block.command,
          lines: currentLines.value.slice()
        })
        currentCmd.value = ''
        currentLines.value = []
        const isLastBlock = blockIdx === frame.blocks.length - 1
        schedule(() => runBlock(blockIdx + 1, frame), isLastBlock ? 200 : props.blockPauseMs)
      })
    }, 180)
  })
}

function runFrame(frameIdx) {
  const frame = normalizeFrame(props.frames[frameIdx])
  if (!frame.blocks?.length) return

  completedBlocks.value = []
  currentCmd.value = ''
  currentLines.value = []
  fading.value = false
  idx.value = frameIdx

  runBlock(0, frame)
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const f = normalizeFrame(props.frames[0])
    completedBlocks.value = f.blocks.map(b => ({ command: b.command, lines: [...(b.lines || [])] }))
    sub.value = 'idle'
    return
  }
  schedule(() => runFrame(0), 500)
})

onBeforeUnmount(clearTimers)
</script>

<style scoped>
.code-terminal {
  width: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #0a0914;
  border: 1px solid rgba(93, 217, 209, 0.25);
  box-shadow:
    0 20px 50px -12px rgba(13, 115, 119, 0.25),
    0 0 0 1px rgba(93, 217, 209, 0.08);
  font-family: ui-monospace, 'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace;
  font-size: 0.82rem;
  line-height: 1.55;
}

:global(.dark) .code-terminal {
  box-shadow:
    0 20px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 40px -10px rgba(93, 217, 209, 0.2);
}

.terminal-chrome {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.dot-red    { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green  { background: #28c840; }

.terminal-title {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

.terminal-body {
  padding: 1rem 1.1rem 1.2rem;
  color: #e6e6e6;
  text-align: left;
  opacity: 1;
  transition: opacity 220ms ease-out;
}

.terminal-body.fading {
  opacity: 0;
}

.line {
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt {
  color: #5dd9d1;
  margin-right: 0.5rem;
  font-weight: 600;
}

.cmd {
  color: #f8f6f3;
}

.response.comment {
  color: rgba(255, 255, 255, 0.5);
}

.response.sql {
  color: #f0e2bd;
}

.response.ts {
  color: #b9d9ec;
}

.response.ts-keyword {
  color: #8fb8d8;
}

.response.json {
  color: #c8e8e4;
}

.response.punct {
  color: #5dd9d1;
}

.cursor {
  display: inline-block;
  color: #5dd9d1;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

@media (max-width: 720px) {
  .code-terminal {
    font-size: 0.72rem;
  }
  .terminal-body {
    padding: 0.7rem 0.85rem 0.85rem;
  }
  .terminal-chrome {
    padding: 0.45rem 0.7rem;
  }
  .terminal-title {
    font-size: 0.65rem;
  }
}

@media (max-width: 380px) {
  .code-terminal {
    font-size: 0.65rem;
  }
}
</style>
