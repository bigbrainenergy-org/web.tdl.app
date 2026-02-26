import { ref, onMounted, onUnmounted } from 'vue'

const now = ref(new Date())
let interval: ReturnType<typeof setInterval> | null = null
let useCount = 0

export function useNow() {
  useCount++

  onMounted(() => {
    if (!interval) {
      interval = setInterval(() => {
        now.value = new Date()
      }, 60000)
    }
  })

  onUnmounted(() => {
    useCount--
  })

  return now
}
