import { boot } from 'quasar/wrappers'
import { VueReCaptcha } from 'vue-recaptcha-v3'

export default boot(({ app }) => {
  // Set recaptcha instance on app
  app.use(VueReCaptcha, {
    siteKey: process.env.RECAPTCHA_SITE_KEY,
    loaderOptions: {
      autoHideBadge: true
    }
  })
})
