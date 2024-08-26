import { ref } from 'vue'
import { useKeyboardEvents, KeyActionMap } from './use-keyboard-events'
import { openCreateTaskDialog, openSearchDialog } from 'src/utils/dialog-utils'

export function useTaskShortcuts() {
  const keyDownActions: KeyActionMap = {
    q: (event) => openTaskCreateEvent(event),
    '/': (event) => openTaskSearchEvent(event)
  }
  const keyUpActions: KeyActionMap = {}

  useKeyboardEvents(keyDownActions, keyUpActions)

  const isDialogOpen = ref(false)

  function isTextInputFocused() {
    const activeElement = document.activeElement
    if (activeElement === null) {
      console.warn('keyboard event thrown but active element not found')
      // Can't tell if input focused, assume it is
      return true
    }
    return activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'
  }

  function openTaskCreateEvent(event: KeyboardEvent) {
    if (!isTextInputFocused && !isDialogOpen.value) {
      openCreateTaskDialog(() => (isDialogOpen.value = false))
      event.preventDefault()
    }
  }

  function openTaskSearchEvent(event: KeyboardEvent) {
    if (!isTextInputFocused && !isDialogOpen.value) {
      openSearchDialog(() => (isDialogOpen.value = false))
      event.preventDefault()
    }
  }
}
