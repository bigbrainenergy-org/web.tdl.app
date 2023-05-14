import { defineStore } from 'pinia';
import { IContextsState } from './i-contexts-state';

export const useContextsStore = defineStore('contexts', {
  state: (): IContextsState => {
    return {}
  }
})