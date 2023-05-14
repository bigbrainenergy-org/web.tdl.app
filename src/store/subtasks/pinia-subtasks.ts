import { defineStore } from 'pinia';
import { ISubtasksState } from './i-subtasks-state';

export const useSubtasksStore = defineStore('subtasks', {
  state: (): ISubtasksState => {
    return {}
  }
})