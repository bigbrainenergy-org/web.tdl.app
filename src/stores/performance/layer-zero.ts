import { defineStore } from 'pinia'
import { Task, TaskRepo } from '../tasks/task'
import { useAllTasksStore } from './all-tasks'
import { useRepo } from 'pinia-orm'
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
        if (val.completed) return
        if (!val.hard_prereqs.some((x) => !x.completed)) this.layerZero.push(val)
      })
      const duration = performance.now() - start
      const target = Math.max(21, this.layerZero.length / 2)
      if (duration > target)
        console.warn(
          `Regenerating layerZeroStore took longer than target of ${Math.floor(
            target
          )}ms - it took ${Math.floor(duration)}ms`
        )
      console.debug({ regen: this.layerZero })
    },
    get() {
      return this.layerZero as Task[]
    },
    /**
     * - If the task is in the layerZero cached array but shouldn't be, delete it
     * - If the task is not in the layerZero cached array but should be, add it
     * - If the task was just added, removeIf all its incomplete postreqs
     * - If the task was just removed, checkAndSet all its incomplete postreqs
     * @param task The task to check
     */
    checkAndSet(task: Task) {
      const index = this.layerZero.findIndex((x) => x.id === task.id)
      const inLZArray = index >= 0
      const taskShouldBeLayerZero = (x: Task) => !x.completed && !x.hasIncompletePrereqs
      const thisTaskShouldBeLayerZero = taskShouldBeLayerZero(task)
      console.debug({
        task,
        inLZArray,
        thisTaskShouldBeLayerZero,
        index,
        valueAtIndex: this.layerZero[index]
      })
      if (inLZArray) {
        if (!thisTaskShouldBeLayerZero) {
          this.layerZero.splice(index, 1)
          console.debug('removed task from layer zero cache')
          task.grabPostreqs(true).forEach((x) => this.checkAndSet(x))
        } else {
          this.layerZero[index] = task
          console.debug('UPDATED task in layer zero cache')
        }
      } else {
        if (thisTaskShouldBeLayerZero) {
          this.layerZero.push(task)
          console.debug('ADDED task to layer zero cache')
          this.layerZero = this.layerZero.filter((x) => !task.hard_postreq_ids.includes(x.id))
        } else {
          console.debug("wasn't in layer zero, and shouldn't be")
          const postreqs = task.grabPostreqs(true)
          postreqs.forEach((x) => {
            if (taskShouldBeLayerZero(x)) {
              console.debug({ 'pushed to layer zero': x })
              const loadedTask = useRepo(TaskRepo).withAll().find(x.id)
              if (loadedTask !== null) this.layerZero.push(loadedTask)
            }
          })
        }
      }
    },
    removeIfExists(task: Task) {
      const index = this.layerZero.findIndex((x) => x.id === task.id)
      if (index >= 0) this.layerZero.splice(index, 1)
    }
  }
})
