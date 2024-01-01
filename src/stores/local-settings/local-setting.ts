import { defineStore } from 'pinia'
import { Model } from 'pinia-orm'
import { Attr, Bool, Str, Uid } from 'pinia-orm/dist/decorators';

export default class LocalSettings extends Model {
  static entity = 'local-settings'

  @Uid() declare id: number | null
  @Str('') declare taskSearch: string
  @Str('') declare selectedList: string
  @Attr([]) declare selectedTags: Array<string>
  @Str('') declare tagsFilter: string
  @Bool(false) declare hideCompleted: boolean
  @Bool(false) declare layerZeroOnly: boolean

  static piniaOptions = {
    persist: true
  }
}

export const useLocalSettingsStore = defineStore('local-settings', {
  state: () => {
    return {
      id: null,
      taskSearch: '',
      selectedList: '',
      selectedTags: [],
      tagsFilter: '',
      hideCompleted: false,
      layerZeroOnly: false
    }
  },
  persist: true,
  actions: {
    toggleHideCompleted() {
      this.hideCompleted = !this.hideCompleted
      return this.hideCompleted
    }
  }
})