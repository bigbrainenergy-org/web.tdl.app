import { defineStore } from 'pinia';
import { IUsersState } from './i-users-state';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { api } from 'src/boot/axios';
import { useRepo } from 'pinia-orm';
import { ICreateUserOptions } from './i-create-user-options';
import User from 'src/models/user';

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
    getUser: (state) => state.user
  },
  actions: {
    async fetchUser() {
      const authenticationStore = useAuthenticationStore()
      const userId = authenticationStore.userId
      const bearerToken = authenticationStore.getBearerToken
  
      const response = await api.get(`/users/${userId}`, {
        headers: { Authorization: bearerToken },
        params: {}
      })
      useRepo(User).save(response.data)
      return response
    },
  
    async update(options: ICreateUserOptions) {
      const authenticationStore = useAuthenticationStore()
      const userId = authenticationStore.userId
      const bearerToken = authenticationStore.getBearerToken
      return new Promise(
        (resolve, reject) => {
          const userId = authenticationStore.userId
          const bearerToken = authenticationStore.getBearerToken
  
          api.patch(`/users/${userId}`,
            {
              time_zone: options.timeZone
            },
            {
              headers: {
                Authorization: bearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(User).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async changePassword(options: ICreateUserOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          const userId = authenticationStore.userId
          const bearerToken = authenticationStore.getBearerToken
  
          api.patch(`/users/${userId}/change-password`,
            {
              user: {
                current_password: options.current_password,
                password: options.password
              }
            },
            {
              headers: {
                Authorization: bearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(User).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    }
  }
})