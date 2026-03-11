import { defineStore } from 'pinia'
import type { RouteTab } from 'src/utils/types'
// import { Model } from 'pinia-orm'
// import { Attr, Bool, Str, Uid } from 'pinia-orm/dist/decorators';

export type BackgroundMode = 'image' | '#000000' | '#220000'

interface LocalSettingsState {
  id: number | null
  taskSearch: string
  currentBaseQueryMode: string
  currentFilteringMode: string
  currentSortingMode: 'sortByPostreqs' | 'sortByAgenda'
  selectedList: string
  selectedTags: Array<string>
  tagsFilter: string
  hideCompleted: boolean
  layerZeroOnly: boolean
  expandEnergyStats: boolean
  expandAllWithSameID: boolean
  maxGraphNodeRadius: number
  graphTraversalDepth: number // 0 = layer zero only, 1+ = include prereqs at that depth
  graphDepthPres: number // depth of prereqs to show in task dialog graph
  graphDepthPosts: number // depth of postreqs to show in task dialog graph
  graphTraverseThroughCompleted: boolean // include completed tasks but don't traverse their dependencies
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
  toolbarButtons: RouteTab[]
  enableQuickSortBailOnBigTask: boolean
  quickSortBailOnTaskSize: number
  taskPostreqInfoView: 'Quantity' | 'Strict'
  strictModeMaxPostreqs: 1 | 2 | 3 | 4 | 5 | 6
  sideBarOpen: boolean
  agendaSortLimit: number
  quickSortLayerZeroDegree: 1 | 2 | 3 | null
  quickSortPostsDegree: 1 | 2 | 3 | null
  addDependencyDegree: 1 | 2 | 3 | null
  unsetDegreeBehavior: 1 | 2 | 3
}

const originalToolbarButtons: RouteTab[] = [
  {
    icon: 'fa-solid fa-list-check',
    to: '/list',
    label: 'List',
    enabled: true,
    default: true
  },
  {
    icon: 'self_improvement',
    to: '/focus',
    label: 'Focus',
    enabled: true,
    default: false
  },
  {
    icon: 'fa-solid fa-project-diagram',
    to: '/tree',
    label: 'Tree',
    enabled: true,
    default: false
  },
  {
    icon: 'hub',
    to: '/graph',
    label: 'Graph',
    enabled: true,
    default: false
  },
  {
    icon: 'fa-solid fa-folder-open',
    to: '/projects',
    label: 'Projects',
    enabled: true,
    default: true
  },
  {
    icon: 'fa-solid fa-star',
    to: '/routines',
    label: 'Routines',
    enabled: true,
    default: false
  }
]

export const useLocalSettingsStore = defineStore('local-settings', {
  state: (): LocalSettingsState => {
    return {
      id: null,
      taskSearch: '',
      currentBaseQueryMode: 'allTasks',
      currentFilteringMode: 'filterByList',
      currentSortingMode: 'sortByPostreqs',
      selectedList: '',
      selectedTags: [],
      tagsFilter: '',
      hideCompleted: true,
      layerZeroOnly: false,
      expandEnergyStats: false,
      expandAllWithSameID: false,
      maxGraphNodeRadius: 100,
      graphTraversalDepth: 4,
      graphDepthPres: 2,
      graphDepthPosts: 2,
      graphTraverseThroughCompleted: false,
      reverseTreeView: false,
      disableQuickSort: true,
      enableQuickSortOnNewTask: false,
      enableQuickSortOnLayerZeroQTY: 1,
      backgroundMode: 'image',
      enableDeeperQuickSort: false,
      omitRedundantSearchResults: false,
      notificationSpeed: 3,
      autoScalePriority: false,
      quickSortDialogMaxToShow: 2,
      toolbarButtons: originalToolbarButtons,
      enableQuickSortBailOnBigTask: false,
      quickSortBailOnTaskSize: 9,
      taskPostreqInfoView: 'Quantity',
      strictModeMaxPostreqs: 1,
      sideBarOpen: true,
      agendaSortLimit: 200,
      quickSortLayerZeroDegree: 1,
      quickSortPostsDegree: 1,
      addDependencyDegree: 2,
      unsetDegreeBehavior: 2
    }
  },
  persist: true,
  actions: {
    resetToolbarButtons() {
      // because Firefox for Android is unusually difficult
      this.toolbarButtons = originalToolbarButtons
    }
  }
})
