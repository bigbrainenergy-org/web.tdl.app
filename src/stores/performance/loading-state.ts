import { defineStore } from 'pinia'

export const useLoadingStateStore = defineStore('loading-state', {
  state: () => ({
    busy: false
  })
})