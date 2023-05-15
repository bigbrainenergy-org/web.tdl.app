import { defineStore } from 'pinia'
import { ILocalSettingsState } from './i-local-settings-state'
export const useLocalSettingsStore = defineStore('local-settings', {
  state: (): ILocalSettingsState => {
    return {
      taskSearch: '',
      selectedList: '',
      selectedTags: [],
      tagsFilter: ''
    }
  },

  getters: {
    selectedList: (state) => state.selectedList,
    selectedTags: (state) => state.selectedTags,
    tagsFilter: (state) => state.tagsFilter,
    taskSearch: (state) => state.taskSearch
  },

  actions: {
    
  }
})