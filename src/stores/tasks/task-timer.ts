import { defineStore } from 'pinia'
import type { TaskTimerState } from './task-interfaces-types'
import type { Task } from './task-model'
import { Logger } from 'src/utils/d'

const TaskTimerLogger = new Logger('Task Timer')

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
      
      clearInterval(this.timer)
      TaskTimerLogger.warn('cleared interval using state function.')
      this.timer = null
    },
    startTimer(task?: Task) {
      if(this.timer) {
        TaskTimerLogger.log('reseting previous timer')
        
        clearInterval(this.timer)
        this.timer = null
      }
      const t = task ?? this.task
      if(t === null) {
        TaskTimerLogger.warn('task is null.')
        return
      }
      this.timeRemaining = (t.task_duration_in_minutes ?? 15) * 60
      this.task = t
      this.timer = setInterval(() => {
        if(this.timeRemaining > 0) {
          this.timeRemaining--
          //TaskTimerLogger.log({ timeRemaining: this.timeRemaining })
        } else this.resetTimer()
      }, 1000)
    }
  }
})