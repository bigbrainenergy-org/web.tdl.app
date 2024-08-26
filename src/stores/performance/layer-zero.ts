import { defineStore } from 'pinia'
import { cachedTask, useAllTasksStore } from 'src/stores/performance/all-tasks'
import { useIncompleteTasksStore } from './incomplete-tasks'

interface LayerZeroState {
  tasks: cachedTask[]
}
export const useLayerZeroStore = defineStore('layer-zero', {
  state: (): LayerZeroState => ({
    tasks: []
  }),
  persist: false,
  getters: {
    typed: (state) => state.tasks as cachedTask[]
  },
  actions: {
    // MUST HAVE INCOMPLETE TASKS REGENERATED FIRST
    regenerate() {
      this.tasks = []
      useIncompleteTasksStore().typed.forEach((x) => {
        if (!x.hard_prereqs.some((y) => !y.completed)) {
          this.tasks.push(x)
        }
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
      const allTasks: cachedTask[] = []
      if (withAll) this.typed.forEach((x: cachedTask) => allTasks.push(this.loadAll(x, ats)))
      return allTasks
    },
    delete(id: number) {
      const index = this.tasks.findIndex((x) => x.id === id)
      if (index >= 0) {
        this.tasks.splice(index, 1)
      }
    }
  }
})
