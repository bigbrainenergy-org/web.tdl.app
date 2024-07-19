import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { Notify } from 'quasar'
import { describe, expect, it } from 'vitest'
import { textColor } from 'src/hackerman/TextColor'

installQuasarPlugin({ plugins: { Notify } })

describe('TextColor helper', () => {
  it('should return black text color when given no background color', () => {
    expect(textColor('')).toBe('#000000')
  })

  it('should return black text color when given light background color', () => {
    expect(textColor('#bfb9eb')).toBe('#000000')
  })

  it('should return white text color when given dark background color', () => {
    expect(textColor('#231d4f')).toBe('#ffffff')
  })
})
