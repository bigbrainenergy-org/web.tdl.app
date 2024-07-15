import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useRepo } from 'pinia-orm'

const incomplete = (x: Task | cachedTask) => !x.completed

export class cachedTask {
  hard_prereqs: Task[]
  hard_postreqs: Task[]
  t: Task
  constructor(data: Task) {
    this.hard_prereqs = [...data.hard_prereqs ?? []]
    this.hard_postreqs = [...data.hard_postreqs ?? []]
    this.t = data
  }
  get hard_prereq_ids() { return this.t.hard_prereq_ids }
  set hard_prereq_ids(ids: number[]) { this.t.hard_prereq_ids = ids }
  get hard_postreq_ids() { return this.t.hard_postreq_ids }
  set hard_postreq_ids(ids: number[]) { this.t.hard_postreq_ids = ids }
  get completed() { return this.t.completed }
  set completed(completed: boolean) { this.t.completed = completed }
  get id(): number { return this.t.id }
  get title() { return this.t.title }
  get incompletePostreqs() { return this.hard_postreqs.filter(incomplete) }
  get incompletePrereqs() { return this.hard_prereqs.filter(incomplete) }
  get task() { 
    this.t.hard_prereqs = this.hard_prereqs
    this.t.hard_postreqs = this.hard_postreqs
    return this.t
  }
  grabPostreqs(hideCompleted: boolean) { return hideCompleted ? this.incompletePostreqs : this.hard_postreqs }
  grabPrereqs(hideCompleted: boolean) { return hideCompleted ? this.incompletePrereqs : this.hard_prereqs }
}

interface AllTasksState {
  allTasks: Map<number, cachedTask>
}
export const useAllTasksStore = defineStore('all-tasks', {
  state: (): AllTasksState => ({
    allTasks: new Map<number, cachedTask>()
  }),
  persist: false,
  getters: {
    typed: (state) => state.allTasks as Map<number, cachedTask>
  },
  actions: {
    regenerate() {
      console.log('regenerating all tasks store.')
      this.allTasks = new Map<number, cachedTask>(
      useRepo(TaskRepo)
        .withAll()
        .get()
        .map((x: Task) => [x.id, new cachedTask(x)]))
    },
    hardGet(id: number) {
      const result = this.typed.get(id)
      if (typeof result === 'undefined')
        throw new Error(`Task ID ${id} was undefined in all tasks store`)
      return result
    },
    loadAll(task: cachedTask) {
      const H = (x: number) => this.hardGet(x).t
      task.hard_prereqs = task.hard_prereq_ids.map(H)
      task.hard_postreqs = task.hard_postreq_ids.map(H)
      return task
    },
    withAll(id: number) {
      return this.loadAll(this.hardGet(id))
    },
    all(withAll = false) {
      const tasks: cachedTask[] = []
      if (withAll) this.typed.forEach((x) => tasks.push(this.loadAll(x)))
      else this.typed.forEach((x) => tasks.push(x))
      return tasks
    },
    remove(id: number) {
      this.allTasks.delete(id)
    }
  }
})
