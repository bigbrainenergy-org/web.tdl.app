import { defineStore } from 'pinia';
import { ITimeZonesState } from './i-time-zones-state';

export const useTimeZonesStore = defineStore('time-zones', {
  state: (): ITimeZonesState => {
    return {
      timeZones: []
    }
  },
  getters: {
    timeZones: (state) => state.timeZones
  }
})