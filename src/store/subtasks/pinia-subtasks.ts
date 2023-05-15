import { defineStore } from 'pinia';
import { ISubtasksState } from './i-subtasks-state';
import { ICreateSubtaskOptions } from './i-create-subtask-options';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { api } from 'src/boot/axios';
import Subtask from 'src/models/subtask';
import { useRepo } from 'pinia-orm';
import { IUpdateSubtaskOptions } from './i-update-subtask-options';

export const useSubtasksStore = defineStore('subtasks', {
  state: (): ISubtasksState => {
    return {}
  },

  actions: {
    async create(options: ICreateSubtaskOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.post('/subtasks',
            {
              title: options.title,
              order: options.order,
              completed: options.completed,
            },
            {
              headers: {
                Authorization: authenticationStore.getBearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(Subtask).save(response.data)
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
          api.delete(`/subtasks/${options.id}`, {
            headers: {
              Authorization: authenticationStore.getBearerToken
            }
          }).
          then(
            (response) => {
              useRepo(Subtask).destroy(options.id)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async update(options: IUpdateSubtaskOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise(
        (resolve, reject) => {
          api.patch(`/subtasks/${options.id}`,
            {
              title: options.title,
              order: options.order,
              completed: options.completed,
            },
            {
              headers: {
                Authorization: authenticationStore.getBearerToken
              }
            }
          ).
          then(
            (response) => {
              useRepo(Subtask).save(response.data)
              resolve(response)
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    },
  
    async fetchSubtasks() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/subtasks', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(Subtask).fresh(response.data)
      return response
    },
  }
})