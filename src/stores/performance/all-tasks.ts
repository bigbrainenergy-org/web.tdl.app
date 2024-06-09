import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'
interface AllTasksState {
  allTasks: Map<number, Task>
}
export const useAllTasksStore = defineStore('all-tasks', {
  state: (): AllTasksState => {
    return {
      allTasks: new Map<number, Task>()
    }
  },
  persist: false,
  actions: {
    regenerate() {
      const start = performance.now()
      this.allTasks = new Map<number, Task>(
        useRepo(TaskRepo)
          .withAll()
          .get()
          .map((x) => [x.id, x])
      )
      const duration = performance.now() - start
      if (duration > this.allTasks.size / 2)
        console.warn(
          `Regenerating allTasksStore took longer than target of ${Math.floor(
            this.allTasks.size / 2
          )}ms - it took ${Math.floor(duration)}ms`
        )
    }
  }
})
