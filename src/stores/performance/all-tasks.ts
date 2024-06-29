import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'
import { Utils } from 'src/util'
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
    },
    completion(id: number, complete = true) {
      const theTask = this.allTasks.get(id)
      if (typeof theTask === 'undefined')
        throw new Error(`Task id ${id} was not found in the cache.`)
      const markCompletion = (task_id: number, relation: 'pre' | 'post') => {
        const task = Utils.hardCheck(this.allTasks.get(task_id))
        let task_index = -1
        if (relation === 'pre') task_index = task.hard_prereqs.findIndex((x) => x.id === id)
        else if (relation === 'post') task_index = task.hard_postreqs.findIndex((x) => x.id === id)
        if (id < 0)
          throw new Error(
            `Task '${theTask.title}' was not found in the dependencies of one of its dependencies.`
          )
        if (relation === 'pre') task.hard_prereqs[task_index].completed = complete
        else if (relation === 'post') task.hard_postreqs[task_index].completed = complete
        this.allTasks.set(task.id, task)
      }
      theTask.hard_prereqs.forEach((x) => markCompletion(x.id, 'post'))
      theTask.hard_postreqs.forEach((x) => markCompletion(x.id, 'pre'))
    }
  }
})
