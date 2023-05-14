import { defineStore } from 'pinia';
import { INextActionsState } from './i-next-actions-state';

export const useNextActionsStore = defineStore('next-actions', {
  state: (): INextActionsState => {
    return {}
  }
})