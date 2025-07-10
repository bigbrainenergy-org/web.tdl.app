import { defineStore } from 'pinia'
import type { TaskTimerState } from './task-interfaces-types'
import type { Task } from './task-model'

export const useTaskTimerStore = defineStore('task-timer', {
  state: (): TaskTimerState => ({
    task: null,
    minimized: false,
    timeRemaining: 0,
    timer: null
  }),
  actions: {
    resetTimer() {
      if(this.timer === null) return
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      clearInterval(this.timer)
      console.warn('cleared interval using state function.')
      this.timer = null
    },
    startTimer(task?: Task) {
      if(this.timer) {
        console.log('reseting previous timer')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        clearInterval(this.timer)
        this.timer = null
      }
      const t = task ?? this.task
      if(t === null) {
        console.warn('task is null.')
        return
      }
      this.timeRemaining = (t.task_duration_in_minutes ?? 15) * 60
      this.task = t
      this.timer = setInterval(() => {
        if(this.timeRemaining > 0) {
          this.timeRemaining--
          console.log({ timeRemaining: this.timeRemaining })
        } else this.resetTimer()
      }, 1000)
    }
  }
})