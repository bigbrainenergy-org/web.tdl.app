import { defineStore } from 'pinia'
// import { Model } from 'pinia-orm'
// import { Attr, Bool, Str, Uid } from 'pinia-orm/dist/decorators';

export type BackgroundMode = 'image' | '#000000' | '#220000'

interface LocalSettingsState {
  id: number | null
  taskSearch: string
  selectedList: string
  selectedTags: Array<string>
  tagsFilter: string
  hideCompleted: boolean
  layerZeroOnly: boolean
  expandEnergyStats: boolean
  expandAllWithSameID: boolean
  maxGraphNodeRadius: number
  reverseTreeView: boolean
  disableQuickSort: boolean
  enableQuickSortOnNewTask: boolean
  enableQuickSortOnLayerZeroQTY:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
  backgroundMode: BackgroundMode
  enableDeeperQuickSort: boolean
  omitRedundantSearchResults: boolean
  notificationSpeed: 1 | 2 | 3
  autoScalePriority: boolean
  quickSortDialogMaxToShow: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
}

export const useLocalSettingsStore = defineStore('local-settings', {
  state: (): LocalSettingsState => {
    return {
      id: null,
      taskSearch: '',
      selectedList: '',
      selectedTags: [],
      tagsFilter: '',
      hideCompleted: true,
      layerZeroOnly: false,
      expandEnergyStats: false,
      expandAllWithSameID: false,
      maxGraphNodeRadius: 100,
      reverseTreeView: false,
      disableQuickSort: true,
      enableQuickSortOnNewTask: false,
      enableQuickSortOnLayerZeroQTY: 1,
      backgroundMode: 'image',
      enableDeeperQuickSort: false,
      omitRedundantSearchResults: false,
      notificationSpeed: 3,
      autoScalePriority: false,
      quickSortDialogMaxToShow: 2
    }
  },
  persist: true
})
