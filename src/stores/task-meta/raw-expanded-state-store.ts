import { defineStore } from 'pinia'

// interface ExpandedState {
//   id: number
//   expanded: boolean
// }

interface RawExpandedStateStoreState {
  expandedNodesRegular: string[]
  expandedNodesReverse: string[]
}

export const useRawExpandedStateStore = defineStore('raw-expanded-state', {
  state: (): RawExpandedStateStoreState => {
    return {
      expandedNodesRegular: [],
      expandedNodesReverse: []
    }
  },
  persist: true,
  actions: {
    forgetTask(id: number) {
      const iToS = id.toString()
      const doesNotContainID = (key: string) => !key.includes(iToS)
      this.expandedNodesRegular = this.expandedNodesRegular.filter(doesNotContainID)
      this.expandedNodesReverse = this.expandedNodesReverse.filter(doesNotContainID)
    }
  },
  getters: {
    hasKey: (state) => {
      return (key: string, reverseMode = false) => {
        if (reverseMode) return state.expandedNodesReverse.includes(key)
        return state.expandedNodesRegular.includes(key)
      }
    }
  }
})
