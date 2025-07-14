import { defineStore } from 'pinia'
import { useTaskStore } from './task-store'

export const dogFoodHarder = defineStore('woof', {
  state: () => ({
    taskLength: 0
  }),
  actions: {
    assertTaskLength(origin: string) {
      if(useTaskStore().allTasks.length !== this.taskLength) console.trace(`${origin} task length expected to be ${this.taskLength} - actual value ${useTaskStore().allTasks.length}`)
    }
  }
})