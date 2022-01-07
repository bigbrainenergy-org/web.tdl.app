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

import nextActions from './next-actions'
import { NextActionsStateInterface } from './next-actions/state'

import waitingFors from './waiting-fors'
import { WaitingForsStateInterface } from './waiting-fors/state'

import projects from './projects'
import { ProjectsStateInterface } from './projects/state'

import contexts from './contexts'
import { ContextsStateInterface } from './contexts/state'

import subtasks from './subtasks'
import { SubtasksStateInterface } from './subtasks/state'

import authentication from './authentication'
import { AuthenticationStateInterface } from './authentication/state'

import localSettings from './local-settings'
import { LocalSettingsStateInterface } from './local-settings/state'

import timeZones from './time-zones'
import { TimeZonesStateInterface } from './time-zones/state'

import users from './users'
import { UsersStateInterface } from './users/state'

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
  nextActions: NextActionsStateInterface,
  waitingFors: WaitingForsStateInterface,
  projects: ProjectsStateInterface,
  //
  contexts: ContextsStateInterface,
  subtasks: SubtasksStateInterface,
  //
  authentication: AuthenticationStateInterface,
  localSettings: LocalSettingsStateInterface,
  //
  timeZones: TimeZonesStateInterface,
  users: UsersStateInterface,
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
      nextActions,
      waitingFors,
      projects,
      //
      contexts,
      subtasks,
      //
      authentication,
      localSettings,
      //
      timeZones,
      users,
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
