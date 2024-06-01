import { defineStore } from 'pinia'
import { Task } from '../tasks/task'
import { useAllTasksStore } from './all-tasks'
interface LayerZeroTasksStore {
  layerZero: Array<Task>
}
export const useLayerZeroStore = defineStore('layer-zero', {
  state: (): LayerZeroTasksStore => ({ layerZero: [] }),
  persist: false,
  actions: {
    regenerate() {
      console.warn('regenerating layer zero store')
      const start = performance.now()
      //this.layerZero = useRepo(TaskRepo).layerZero()
      this.layerZero = []
      useAllTasksStore().allTasks.forEach((val, key) => {
        if(val.completed) return
        if(!val.hard_prereqs.some(x => !x.completed)) this.layerZero.push(val)
      })
      const duration = performance.now() - start
      const target = Math.max(21, this.layerZero.length / 2)
      if(duration > target) console.warn(`Regenerating layerZeroStore took longer than target of ${Math.floor(target)}ms - it took ${Math.floor(duration)}ms`)
      console.debug({ regen: this.layerZero })
    },
    get() { return this.layerZero as Task[] }
  }
})