import { defineStore } from 'pinia'
import { useTaskStore } from './task-store'
import type { Task } from './task-model'

export interface HeaderTimerState {
  nextDate: Date // the date of the next task due date
  timer: any // ref to the timer or null
  dueTasks: Set<Task>,
  remindTasks: Set<Task>
}

type StringKeysOf<T> = {
  [K in keyof T]: T[K] extends string | undefined ? K : never;
}[keyof T] & string;

export const useHeaderTimerStore = defineStore('header timer', {
  state: (): HeaderTimerState => ({
    nextDate: new Date(),
    timer: null,
    dueTasks: new Set(),
    remindTasks: new Set()
  }),
  actions: {
    inject(x: Task, now = new Date()) {
      if(x.completed) {
        this.remindTasks.delete(x)
        this.dueTasks.delete(x)
        return
      }
      if(x.remind_me_at && new Date(x.remind_me_at) < now) this.remindTasks.add(x)
      else this.remindTasks.delete(x)
      if(x.deadline_at && new Date(x.deadline_at) < now) this.dueTasks.add(x)
      else this.dueTasks.delete(x)
    },
    collectTasks() {
      this.dueTasks.clear()
      this.remindTasks.clear()
      const now = new Date()
      useTaskStore().incompleteOnly.value.forEach(x => {
        if(x.remind_me_at && new Date(x.remind_me_at) < now) this.remindTasks.add(x)
        if(x.deadline_at && new Date(x.deadline_at) < now) this.dueTasks.add(x)
      })
    },
    clear() {
      if(this.timer) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        clearInterval(this.timer)
        this.timer = null
      }
    },
    wind() {
      this.clear()
      const now = new Date()
      const extractFutureDate = (k: StringKeysOf<Task>) => (x: Task) => {
        if(typeof x[k] !== 'undefined') {
          const d = new Date(x[k])
          if(d > now) return d
        }
        return undefined
      }
      const date_extract = (x: Task) => extractFutureDate('deadline_at')(x) ?? extractFutureDate('remind_me_at')(x) ?? undefined
      const five = new Date()
      five.setTime(five.getTime() * 5*60*1000)
      this.nextDate = useTaskStore().incompleteOnly.value
        .map(date_extract)
        .filter(x => typeof x !== 'undefined')
        .reduce((min, item) => {
          const val = item
          return val < min ? val : min
        }, five)
      this.timer = setInterval(() => {
        if(now.getTime() > this.nextDate.getTime()) {
          // collect due tasks
          this.wind()
        }
      }, 5000)
    }
  }
})