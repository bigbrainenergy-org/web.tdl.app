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
    get() { return this.layerZero as Task[] },
    /**
     * - If the task is in the layerZero cached array but shouldn't be, delete it
     * - If the task is not in the layerZero cached array but should be, add it
     * - If the task was just added, removeIf all its incomplete postreqs
     * - If the task was just removed, checkAndSet all its incomplete postreqs
     * @param task The task to check
     */
    checkAndSet(task: Task) {
      const index = this.layerZero.findIndex(x => x.id === task.id)
      const inLZArray = index >= 0
      const taskShouldBeLayerZero = !task.completed && !task.hasIncompletePrereqs
      if(inLZArray) {
        if(!taskShouldBeLayerZero) {
          this.layerZero.splice(index, 1)
          task.grabPostreqs(false).forEach(x => this.checkAndSet(x))
        }
        else {
          this.layerZero[index] = task
        }
      }
      else {
        if(taskShouldBeLayerZero) {
          this.layerZero.push(task)
          this.layerZero = this.layerZero.filter(x => !task.hard_postreq_ids.includes(x.id))
        }
      }
    },
    removeIfExists(task: Task) {
      const index = this.layerZero.findIndex(x => x.id === task.id)
      if(index >= 0) this.layerZero.splice(index, 1)
    }
  }
})