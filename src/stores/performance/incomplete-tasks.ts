import { defineStore } from 'pinia'
import { Task } from '../tasks/task'
import { useAllTasksStore } from './all-tasks'

interface IncompleteTasksState {
  incompleteTasks: Map<number, Task>
}
export const useIncompleteTasksStore = defineStore('incomplete-tasks', {
  state: (): IncompleteTasksState => ({
    incompleteTasks: new Map<number, Task>()
  }),
  persist: false,
  actions: {
    regenerate() {
      this.incompleteTasks.clear()
      useAllTasksStore().typed.forEach(x => {
        if(!x.completed) this.incompleteTasks.set(x.id, x)
      })
    }
  }
})