import { defineStore } from 'pinia';
import { IUsersState } from './i-users-state';

export const useUsersStore = defineStore('users', {
  state: (): IUsersState => {
    return {
      user: {
        id: 0,
        username: '',
        locale: 'en',
        time_zone: 'UTC'
      }
    }
  },
  getters: {
    username: (state) => state.user.username,
    timeZone: (state) => state.user.time_zone,
    user: (state) => state.user
  }
})