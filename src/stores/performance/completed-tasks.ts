import { defineStore } from 'pinia'
import { Task } from '../tasks/task'
import { cachedTask, useAllTasksStore } from './all-tasks'

interface CompleteTasksState {
  tasks: Map<number, cachedTask>
}

const useCompletedTasksStore = defineStore('completed-tasks', {
  state: () => ({
    tasks: new Map<number, cachedTask>()
  }),
  persist: false,
  getters: {
    typed: (state) => state.tasks as Map<number, cachedTask>
  },
  actions: {
    regenerate() {
      this.tasks.clear()
      useAllTasksStore().typed.forEach((x) => {
        if (x.completed) this.tasks.set(x.id, x)
      })
    },
    loadAll(task: cachedTask, ats = useAllTasksStore()) {
      const H = (x: number) => ats.hardGet(x).t
      task.hard_prereqs = task.hard_prereq_ids.map(H)
      task.hard_postreqs = task.hard_postreq_ids.map(H)
      return task
    },
    withAll(id: number) {
      const ats = useAllTasksStore()
      return this.loadAll(ats.hardGet(id), ats)
    },
    all(withAll = false) {
      const ats = useAllTasksStore()
      const tasks: cachedTask[] = []
      if (withAll) this.typed.forEach((x: cachedTask) => tasks.push(this.loadAll(x, ats)))
    }
  }
})
