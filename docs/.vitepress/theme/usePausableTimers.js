import { ref, onBeforeUnmount } from 'vue'

/**
 * setTimeout wrapper whose pending timers can be paused and resumed.
 * On pause, each pending timer remembers how much time it had left;
 * on resume, it is re-armed for exactly that remainder.
 */
export function usePausableTimers() {
  const paused = ref(false)
  const pending = new Set()

  function arm(entry) {
    entry.start = Date.now()
    entry.id = setTimeout(() => {
      pending.delete(entry)
      entry.fn()
    }, entry.remaining)
  }

  function schedule(fn, ms) {
    const entry = { fn, remaining: ms, id: null, start: 0 }
    pending.add(entry)
    if (!paused.value) arm(entry)
  }

  function pause() {
    if (paused.value) return
    paused.value = true
    for (const e of pending) {
      if (e.id === null) continue
      clearTimeout(e.id)
      e.id = null
      e.remaining = Math.max(0, e.remaining - (Date.now() - e.start))
    }
  }

  function resume() {
    if (!paused.value) return
    paused.value = false
    for (const e of pending) {
      if (e.id === null) arm(e)
    }
  }

  function toggle() {
    paused.value ? resume() : pause()
  }

  function clear() {
    for (const e of pending) {
      if (e.id !== null) clearTimeout(e.id)
    }
    pending.clear()
  }

  onBeforeUnmount(clear)

  return { paused, schedule, pause, resume, toggle, clear }
}
