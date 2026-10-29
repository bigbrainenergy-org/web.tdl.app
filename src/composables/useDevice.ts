import { ref } from 'vue'
import { useQuasar } from 'quasar'

const isTouchDevice = ref<boolean | null>(null)

export function useDevice() {
  if (isTouchDevice.value === null) {
    const $q = useQuasar()
    isTouchDevice.value = $q.platform.has.touch && !window.matchMedia('(hover: hover)').matches
  }
  return isTouchDevice
}
