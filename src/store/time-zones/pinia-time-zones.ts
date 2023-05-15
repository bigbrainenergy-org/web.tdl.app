import { defineStore } from 'pinia';
import { ITimeZonesState } from './i-time-zones-state';
import { api } from 'src/boot/axios';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { useRepo } from 'pinia-orm';
import TimeZone from 'src/models/time_zone';

export const useTimeZonesStore = defineStore('time-zones', {
  state: (): ITimeZonesState => {
    return {
      timeZones: []
    }
  },

  getters: {
    timeZones: (state) => state.timeZones
  },

  actions: {
    async fetchTimeZones() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/time-zones', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(TimeZone).fresh(response.data)
      return response
    },
  }
})