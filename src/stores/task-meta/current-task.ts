import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'

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