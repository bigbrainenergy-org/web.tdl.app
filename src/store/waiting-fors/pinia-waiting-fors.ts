import { defineStore } from 'pinia';
import { IWaitingForsState } from './i-waiting-fors-state';
import { api } from 'src/boot/axios';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { IUpdateWaitingForsOptions } from './i-update-waiting-fors-options';
import { useRepo } from 'pinia-orm';
import WaitingFor from 'src/models/waiting_for';
import { ICreateWaitingForsOptions } from './i-create-waiting-fors-options';

export const useWaitingForsStore = defineStore('waiting-fors', {
  state: (): IWaitingForsState => {
    return {}
  },

  actions: {
    async create(options: ICreateWaitingForsOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.post('/waiting_fors',
            {
              title: options.title,
              notes: options.notes
            },
            {
              headers: {
                Authorization: authenticationStore.getBearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(WaitingFor).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async delete(options: { id: number }) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.delete(`/waiting_fors/${options.id}`, {
            headers: {
              Authorization: authenticationStore.getBearerToken
            }
          }).
          then(
            (response) => {
              useRepo(WaitingFor).destroy(options.id)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async update(options: IUpdateWaitingForsOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.patch(`/waiting_fors/${options.id}`,
            {
              title: options.title,
              notes: options.notes
            },
            {
              headers: {
                Authorization: authenticationStore.getBearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(WaitingFor).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async fetchWaitingFors() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/waiting_fors', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(WaitingFor).fresh(response.data)
      return response
    }
  }
})