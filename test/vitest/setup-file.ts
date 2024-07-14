// This file will be run before each test file
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { vi } from 'vitest'

import messages from 'src/i18n'

const i18n = createI18n({
  locale: 'en-US',
  legacy: false,
  messages
})

config.global.plugins = [i18n]
config.global.mocks.$t = (key: any) => key

// FIXME: This creates false negatives because it won't actually render any
//        elements, it just makes it not implode when IntersectionObserver is
//        called.
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn()
}))

// now you can access it as `IntersectionObserver` or `window.IntersectionObserver`
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
