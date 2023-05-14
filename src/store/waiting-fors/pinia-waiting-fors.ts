import { defineStore } from 'pinia';
import { IWaitingForsState } from './i-waiting-fors-state';

export const useWaitingForsStore = defineStore('waiting-fors', {
  state: (): IWaitingForsState => {
    return {}
  }
})