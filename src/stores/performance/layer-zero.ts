import { defineStore } from 'pinia'
import { Task } from '../tasks/task'
import { useIncompleteTasksStore } from './incomplete-tasks'

interface LayerZeroState {
  layerZero: Array<Task>
}
export const useLayerZeroStore = defineStore('layer-zero', {
  state: (): LayerZeroState => ({
    layerZero: new Array<Task>()
  }),
  persist: false,
  getters: {
    typed: (state) => state.layerZero as Task[]
  },
  actions: {
    /**
     * NOTE: ensure incomplete tasks store was regenerated before this one.
     */
    regenerate() {
      this.layerZero = []
      useIncompleteTasksStore().incompleteTasks.forEach(x => {
        if(!x.hasIncompletePrereqs) this.layerZero.push(x)
      })
    }
  }
})