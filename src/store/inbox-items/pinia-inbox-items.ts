import { defineStore } from 'pinia';
import { IInboxItemsState } from './i-inbox-items-state';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { ICreateInboxItemOptions } from './i-create-inbox-item-options';
import { api } from 'src/boot/axios';
import { useRepo } from 'pinia-orm';
import InboxItem from 'src/models/inbox_item';
import { IUpdateInboxItemOptions } from './i-update-inbox-item-options';

export const useInboxItemsStore = defineStore('inbox-items', {
  state: (): IInboxItemsState => {
    return {}
  },

  actions: {
    async create(options: ICreateInboxItemOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.post('/inbox_items',
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
              useRepo(InboxItem).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        })
    },

    async delete(options: { id: number }) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.delete(`/inbox_items/${options.id}`, {
            headers: {
              Authorization: authenticationStore.getBearerToken
            }
          }).
          then(
            (response) => {
              useRepo(InboxItem).destroy(options.id)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async update(options: IUpdateInboxItemOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.patch(`/inbox_items/${options.id}`,
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
              useRepo(InboxItem).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async fetchInboxItems() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/inbox_items', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(InboxItem).fresh(response.data)
      return response
    },
  }
})