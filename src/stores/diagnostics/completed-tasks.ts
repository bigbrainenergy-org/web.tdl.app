import { defineStore } from 'pinia'
import { Task } from '../tasks/task'

interface CompletedTasksStoreState {
  completedTasks: Map<number, Task>
}

export const useCompletedTasksStore = defineStore('CompletedTasks', {
  state: (): CompletedTasksStoreState => ({ completedTasks: new Map<number, Task>() }),
  persist: false,
  actions: {
    hasID(id: number) {
      return this.completedTasks.has(id)
    },
    hasTask(task: Task) {
      return this.hasID(task.id)
    },
    check(task: Task) {
      if (this.hasTask(task)) throw new Error(`Task '${task.title}' was ALREADY COMPLETE`)
    },
    removeID(id: number) {
      this.completedTasks.delete(id)
    },
    removeTask(task: Task) {
      this.removeID(task.id)
    },
    set(task: Task) {
      if (task.completed) this.completedTasks.set(task.id, task)
      else this.removeTask(task)
    },
    checkAll(tasks: Task[]) {
      tasks.forEach((x) => this.check(x))
    }
  }
})
