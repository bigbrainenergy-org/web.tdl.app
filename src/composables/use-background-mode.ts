import { BackgroundMode, useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { computed, ref, watch } from 'vue'

export function useBackgroundMode() {
  const backgroundModeSetting = computed<BackgroundMode>(
    () => useLocalSettingsStore().backgroundMode
  )
  const initialMode = backgroundModeSetting.value
  const currentBackgroundMode = ref<string>(initialMode === 'image' ? '#000000' : initialMode)
  const backgroundStyle = computed(() =>
    backgroundModeSetting.value !== 'image'
      ? `background-color: ${currentBackgroundMode.value} !important`
      : undefined
  )

  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  // Helper function to convert RGB to hex
  function rgbToHex(r: number, g: number, b: number) {
    console.debug({ r, g, b })
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        })
        .join('')
    )
  }

  // Helper function to increment or decrement a value by one step towards a target
  function stepTowards(current: number, target: number) {
    if (current < target) {
      return current + 1
    } else if (current > target) {
      return current - 1
    } else {
      return current
    }
  }

  const incrementHexColor = (currentValue: string, targetValue: string) => {
    const currentRGB = hexToRgb(currentValue)
    const targetRGB = hexToRgb(targetValue)
    currentRGB.r = stepTowards(currentRGB.r, targetRGB.r)
    currentRGB.g = stepTowards(currentRGB.g, targetRGB.g)
    currentRGB.b = stepTowards(currentRGB.b, targetRGB.b)
    return rgbToHex(currentRGB.r, currentRGB.g, currentRGB.b)
  }

  watch(backgroundModeSetting, () => {
    console.log('background mode setting was changed.')
    const animationHack = setInterval(() => {
      if (backgroundModeSetting.value === 'image') clearInterval(animationHack)
      if (backgroundModeSetting.value === currentBackgroundMode.value) clearInterval(animationHack)
      else
        currentBackgroundMode.value = incrementHexColor(
          currentBackgroundMode.value,
          backgroundModeSetting.value
        )
    }, 10)
  })

  return { backgroundStyle }
}
