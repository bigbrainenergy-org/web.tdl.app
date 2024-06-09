// This file will be run before each test file
import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'

import messages from 'src/i18n'

const i18n = createI18n({
  locale: 'en-US',
  legacy: false,
  messages
})

config.global.plugins = [i18n]
config.global.mocks.$t = (key: any) => key
