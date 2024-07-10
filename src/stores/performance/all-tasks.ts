import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'

interface AllTasksState {
  allTasks: Map<number, Task>
}
export const useAllTasksStore = defineStore('all-tasks', {
  state: (): AllTasksState => ({
    allTasks: new Map<number, Task>()
  }),
  persist: false,
  getters: {
    typed: (state) => state.allTasks as Map<number, Task>
  },
  actions: {
    regenerate() {
      this.allTasks = new Map<number, Task>(useRepo(TaskRepo).withAll().get().map((x: Task) => [x.id, x]))
    },
    hardGet(id: number) {
      const result = this.typed.get(id)
      if(typeof result === 'undefined') throw new Error(`Task ID ${id} was undefined in all tasks store`)
      return result
    }
  }
})