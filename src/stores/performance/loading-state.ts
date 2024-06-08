import { defineStore } from 'pinia'

interface loadingState {
  busy: boolean
  createTaskDialogActive: boolean
  addDependencyDialogActive: boolean
  quickSortDialogActive: boolean
}

export const useLoadingStateStore = defineStore('loading-state', {
  state: (): loadingState => ({
    busy: false,
    createTaskDialogActive: false,
    addDependencyDialogActive: false,
    quickSortDialogActive: false
  }),
  getters: {
    dialogOpen: (state) => state.addDependencyDialogActive || state.createTaskDialogActive || state.quickSortDialogActive,
    dialogOpenExclQuickSort: (state) => {
      console.log({ depDialog: state.addDependencyDialogActive, createDialog: state.createTaskDialogActive })
      return (state.addDependencyDialogActive || state.createTaskDialogActive) && !state.quickSortDialogActive
    }
  }
})