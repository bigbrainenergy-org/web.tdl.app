import { store } from 'quasar/wrappers';
import { PiniaPlugin, createPinia } from 'pinia';
import { Router } from 'vue-router';
import { createORM } from 'pinia-orm';
import { createPersistedState } from 'pinia-plugin-persistedstate';

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module 'pinia' {
  export interface PiniaCustomProperties {
    readonly router: Router;
  }
}

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default store((/* { ssrContext } */) => {
  const pinia = createPinia().use(createORM() as PiniaPlugin);
  pinia.use(createPersistedState())
  return pinia;
});