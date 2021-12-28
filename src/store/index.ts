import { store } from 'quasar/wrappers'
import { InjectionKey } from 'vue'
import {
  createStore,
  Store as VuexStore,
  useStore as vuexUseStore,
} from 'vuex'
import VuexORM from '@vuex-orm/core'
import createPersistedState from 'vuex-persistedstate'

import inboxItems from './inbox-items'
import { InboxItemsStateInterface } from './inbox-items/state'

import authentication from './authentication'
import { AuthenticationStateInterface } from './authentication/state'

import settings from './settings'
import { SettingsStateInterface } from './settings/state'

import lists from './lists'
import { ListsStateInterface } from './lists/state'

import tags from './tags'
import { TagsStateInterface } from './tags/state'

import tasks from './tasks'
import { TasksStateInterface } from './tasks/state'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export interface StateInterface {
  inboxItems: InboxItemsStateInterface,
  authentication: AuthenticationStateInterface,
  settings: SettingsStateInterface,
  lists: ListsStateInterface,
  tags: TagsStateInterface,
  tasks: TasksStateInterface,
}

// provide typings for `this.$store`
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: VuexStore<StateInterface>
  }
}

// provide typings for `useStore` helper
export const storeKey: InjectionKey<VuexStore<StateInterface>> = Symbol('vuex-key')

export default store(function (/* { ssrContext } */) {
  const Store = createStore<StateInterface>({
    plugins: [
      VuexORM.install(),
      createPersistedState()
    ],

    modules: {
      inboxItems,
      authentication,
      settings,
      lists,
      tags,
      tasks
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: !!process.env.DEBUGGING
  })

  return Store;
})

export function useStore() {
  return vuexUseStore(storeKey)
}
