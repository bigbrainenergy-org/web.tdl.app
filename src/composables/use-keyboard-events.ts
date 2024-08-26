import { onMounted, onUnmounted } from 'vue'

export interface KeyActionMap {
  [key: string]: (event: KeyboardEvent) => void
}

export function useKeyboardEvents(keyDownActions: KeyActionMap, keyUpActions: KeyActionMap) {
  function normalizeKey(event: KeyboardEvent): string {
    if (event.key === 'Q' || event.key === 'q') {
      return 'q'
    }

    // Normalize different codes for "/"
    if (event.key === '/' || event.key === 'Slash') {
      return '/'
    }

    return event.key
  }

  function handleKeyDown(event: KeyboardEvent) {
    const normalizedKey = normalizeKey(event)
    const action = keyDownActions[normalizedKey]
    if (action) {
      action(event)
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    const normalizedKey = normalizeKey(event)
    const action = keyUpActions[normalizedKey]
    if (action) {
      action(event)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })
}
