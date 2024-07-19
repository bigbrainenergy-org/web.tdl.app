import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { Notify } from 'quasar'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import errorNotification from 'src/hackerman/ErrorNotification'
import { createPinia, setActivePinia } from 'pinia'

installQuasarPlugin({ plugins: { Notify } })

// Mock the Notify plugin
vi.mock('quasar', async () => {
  const actual = await vi.importActual<typeof import('quasar')>('quasar')
  return {
    ...actual,
    Notify: {
      create: vi.fn()
    }
  }
})

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('ErrorNotification helper', () => {
  it('should send a Notify.create message when called', () => {
    const spy = vi.spyOn(Notify, 'create').mockImplementation(() => vi.fn())
    expect(spy).not.toHaveBeenCalled()
    errorNotification(new Error(), '')
    expect(spy).toHaveBeenCalled()
  })
})
