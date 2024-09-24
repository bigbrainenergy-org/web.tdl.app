import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { Notify } from 'quasar'
import { describe, expect, it } from 'vitest'
import { autoContrastTextColor } from 'src/utils/color-utils'

installQuasarPlugin({ plugins: { Notify } })

describe('autoContrastTextColor', () => {
  it('should return black text color when given no background color', () => {
    expect(autoContrastTextColor('')).toBe('#000000')
  })

  it('should return black text color when given light background color', () => {
    expect(autoContrastTextColor('#bfb9eb')).toBe('#000000')
  })

  it('should return white text color when given dark background color', () => {
    expect(autoContrastTextColor('#231d4f')).toBe('#ffffff')
  })
})
