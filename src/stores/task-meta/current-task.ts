import { defineStore } from 'pinia'

interface CurrentTaskStoreState {
  id: number | null
}

export const useCurrentTaskStore = defineStore('current-task', {
  state: (): CurrentTaskStoreState => {
    return {
      id: null
    }
  },
  persist: true,
  actions: {
    setCurrentTask(id: number) {
      this.id = id
    }
  }
})