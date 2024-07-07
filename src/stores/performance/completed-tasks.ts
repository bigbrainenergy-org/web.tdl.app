import { defineStore } from 'pinia'
import { Task } from '../tasks/task'
import { useAllTasksStore } from './all-tasks'

interface CompletedTasksState {
  completedTasks: Map<number, Task>
}
export const useCompletedTasksStore = defineStore('completed-tasks', {
  state: (): CompletedTasksState => ({
    completedTasks: new Map<number, Task>()
  }),
  persist: false,
  actions: {
    regenerate() {
      this.completedTasks.clear()
      useAllTasksStore().typed.forEach(x => {
        if(x.completed) this.completedTasks.set(x.id, x)
      })
    }
  }
})