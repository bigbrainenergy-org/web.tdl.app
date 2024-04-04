import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'
interface AllTasksState {
  allTasks: Map<number, Task>
}
export const useAllTasksStore = defineStore('all-tasks', {
  state: (): AllTasksState => {
    return {
      allTasks: new Map<number, Task>(),
    }
  },
  persist: false,
  actions: {
    regenerate() {
      console.time('regen')
      this.allTasks = new Map<number, Task>(useRepo(TaskRepo).withAll().get().map(x => [x.id, x]))
      console.timeEnd('regen')
    }
  }
})