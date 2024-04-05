import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'
import { ID } from 'src/types'
interface AllTasksState {
  allTasks: Map<ID, Task>
}
export const useAllTasksStore = defineStore('all-tasks', {
  state: (): AllTasksState => {
    return {
      allTasks: new Map<ID, Task>(),
    }
  },
  persist: false,
  actions: {
    regenerate() {
      this.allTasks = new Map<ID, Task>(useRepo(TaskRepo).withAll().get().map(x => [x.id, x]))
    }
  }
})