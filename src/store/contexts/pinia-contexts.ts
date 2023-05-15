import { defineStore } from 'pinia';
import { IContextsState } from './i-contexts-state';
import { ICreateContextOptions } from './i-create-context-options';
import { api } from 'src/boot/axios';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { useRepo } from 'pinia-orm';
import Context from 'src/models/context';
import { IUpdateContextOptions } from './i-update-context-options';

export const useContextsStore = defineStore('contexts', {
  state: (): IContextsState => {
    return {}
  },
  actions: {
    async create(options: ICreateContextOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise((resolve, reject) => {
        api.post('/contexts', {
          title: options.title,
          color: options.color
        }, {
          headers: {
            Authorization: authenticationStore.getBearerToken
          }
        })
        .then((response) => {
          useRepo(Context).save(response.data)
          resolve(response)
        }),
        (error: any) => {
          reject(error)
        }
      })
    },

    async delete(options: { id: number }) {
      const authenticationStore = useAuthenticationStore()
      return new Promise((resolve, reject) => {
        api.delete(`/contexts/${options.id}`, {
          headers: {
            Authorization: authenticationStore.getBearerToken
          }
        })
        .then((response) => {
          useRepo(Context).destroy(options.id)
          resolve(response)
        },
        (error: any) => {
          reject(error)
        })
      })
    },

    async update(options: IUpdateContextOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise((resolve, reject) => {
        api.patch(`/contexts/${options.id}`, {
          title: options.title,
          color: options.color
        }, {
          headers: {
            Authorization: authenticationStore.getBearerToken
          }
        })
        .then((response) => {
          useRepo(Context).save(response.data)
          resolve(response)
        },
        (error: any) => reject(error))
      })
    },

    async fetchContexts() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/contexts', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(Context).fresh(response.data)
      return response
    }
  }
})