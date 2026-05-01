<template>
  <div class="hero-terminal" aria-label="SQL file source and curl request with JSON response">
    <div class="terminal-chrome">
      <span class="dot dot-red"></span>
      <span class="dot dot-yellow"></span>
      <span class="dot dot-green"></span>
      <span class="terminal-title">~ npgsqlrest</span>
    </div>
    <div class="terminal-body" :class="{ fading }">
      <template v-if="frame === 1">
        <div class="line">
          <span class="prompt">$</span>
          <span class="cmd">{{ typedCmd1 }}</span><span v-if="sub === 'typing'" class="cursor">▌</span>
        </div>
        <div v-for="(l, i) in visibleSqlLines" :key="'s' + i" class="line response" :class="l.cls">{{ l.text }}</div>
        <div v-if="sub === 'idle'" class="line">
          <span class="prompt">$</span>
          <span class="cursor">▌</span>
        </div>
      </template>

      <template v-else>
        <div class="line">
          <span class="prompt">$</span>
          <span class="cmd">{{ typedCmd2 }}</span><span v-if="sub === 'typing'" class="cursor">▌</span>
        </div>
        <div v-for="(l, i) in visibleJsonLines" :key="'j' + i" class="line response" :class="l.cls">{{ l.text }}</div>
        <div v-if="sub === 'idle'" class="line">
          <span class="prompt">$</span>
          <span class="cursor">▌</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const cmd1 = 'cat sql/users.sql'
const sqlLines = [
  { text: '-- HTTP GET', cls: 'comment' },
  { text: '-- @param $1 role text', cls: 'comment' },
  { text: 'select id, name, role', cls: 'sql' },
  { text: 'from users', cls: 'sql' },
  { text: 'where $1 is null or role = $1;', cls: 'sql' }
]

const cmd2 = "curl -s 'localhost:8080/api/users?role=admin' | jq"
const jsonLines = [
  { text: '[', cls: 'punct' },
  { text: '  { "id": 1, "name": "Alice", "role": "admin" },', cls: 'json' },
  { text: '  { "id": 4, "name": "Diana", "role": "admin" }', cls: 'json' },
  { text: ']', cls: 'punct' }
]

const frame = ref(1)
const sub = ref('typing')
const typedCmd1 = ref('')
const typedCmd2 = ref('')
const visibleSqlLines = ref([])
const visibleJsonLines = ref([])
const fading = ref(false)

const timers = []
const clearTimers = () => { while (timers.length) clearTimeout(timers.pop()) }
const schedule = (fn, ms) => timers.push(setTimeout(fn, ms))

function typeOut(target, text, onDone) {
  let i = 0
  const step = () => {
    if (i >= text.length) return onDone()
    target.value = text.slice(0, i + 1)
    i++
    schedule(step, 30 + Math.random() * 28)
  }
  step()
}

function streamLines(target, lines, perLineMs, onDone) {
  let i = 0
  const step = () => {
    if (i >= lines.length) return onDone()
    target.value = [...target.value, lines[i]]
    i++
    schedule(step, perLineMs)
  }
  step()
}

function transitionTo(nextFrame, idleMs) {
  fading.value = true
  schedule(() => {
    if (nextFrame === 1) showFrame1()
    else showFrame2()
  }, 220)
}

function showFrame1() {
  typedCmd1.value = ''
  visibleSqlLines.value = []
  frame.value = 1
  sub.value = 'typing'
  fading.value = false

  typeOut(typedCmd1, cmd1, () => {
    schedule(() => {
      sub.value = 'output'
      streamLines(visibleSqlLines, sqlLines, 80, () => {
        schedule(() => {
          sub.value = 'idle'
          schedule(() => transitionTo(2), 2600)
        }, 200)
      })
    }, 200)
  })
}

function showFrame2() {
  typedCmd2.value = ''
  visibleJsonLines.value = []
  frame.value = 2
  sub.value = 'typing'
  fading.value = false

  typeOut(typedCmd2, cmd2, () => {
    schedule(() => {
      sub.value = 'output'
      streamLines(visibleJsonLines, jsonLines, 100, () => {
        schedule(() => {
          sub.value = 'idle'
          schedule(() => transitionTo(1), 3800)
        }, 200)
      })
    }, 200)
  })
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typedCmd1.value = cmd1
    visibleSqlLines.value = [...sqlLines]
    frame.value = 1
    sub.value = 'idle'
    return
  }
  schedule(showFrame1, 600)
})

onBeforeUnmount(() => {
  clearTimers()
})
</script>

<style scoped>
.hero-terminal {
  width: 100%;
  max-width: 480px;
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

:global(.dark) .hero-terminal {
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
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
}

.terminal-body {
  padding: 1rem 1.1rem 1.2rem;
  min-height: 200px;
  color: #e6e6e6;
  text-align: left;
  opacity: 1;
  transition: opacity 200ms ease-out;
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
  color: rgba(255, 255, 255, 0.48);
}

.response.sql {
  color: #f0e2bd;
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

@media (max-width: 640px) {
  .hero-terminal {
    font-size: 0.7rem;
    max-width: 100%;
  }
  .terminal-body {
    padding: 0.7rem 0.85rem 0.85rem;
    min-height: 165px;
  }
  .terminal-chrome {
    padding: 0.45rem 0.7rem;
  }
  .terminal-title {
    font-size: 0.65rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 50%;
  }
  .line {
    white-space: pre-wrap;
    word-break: break-word;
  }
}

@media (max-width: 380px) {
  .hero-terminal {
    font-size: 0.65rem;
  }
  .terminal-title {
    display: none;
  }
}
</style>
