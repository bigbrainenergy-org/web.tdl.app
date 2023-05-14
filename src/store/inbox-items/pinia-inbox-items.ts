import { defineStore } from 'pinia';

export const useInboxItemsStore = defineStore('inbox-items', {
  state: (): IInboxItems => {
    return {}
  }
})