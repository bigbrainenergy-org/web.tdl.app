import { boot } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import { createORM } from 'pinia-orm'

const pinia = createPinia().use(createORM())

export default boot(({ app }) => {
  app.use(pinia)
  app.provide('pinia', pinia)
})

export { pinia }