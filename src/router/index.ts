import { route } from 'quasar/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes'
import { useAuthenticationStore } from 'src/stores/authentication/pinia-authentication'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  router.beforeEach((to, from, next) => {
    const authenticationStore = useAuthenticationStore()
    if (authenticationStore.isLoggedIn !== true && to.name !== 'Login') next({ name: 'Login' })
    if (to.path === '' || to.path === '/') {
      const localSettingsStore = useLocalSettingsStore()
      const defaultRoutes = localSettingsStore.toolbarButtons.filter((x) => x.default === true)
      if (defaultRoutes.length > 0) next({ path: defaultRoutes[0].to.substring(1) })
      else next({ name: 'Tasks' })
    } else next()
  })

  return router
})
