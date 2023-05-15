import { defineStore } from 'pinia';
import { INextActionsState } from './i-next-actions-state';
import { api } from 'src/boot/axios';
import { ICreateNextActionOptions } from './i-create-next-action-options';
import { useAuthenticationStore } from '../authentication/pinia-authentication';
import { IUpdateNextActionOptions } from './i-update-next-action-options';
import NextAction from 'src/models/next_action';
import { useRepo } from 'pinia-orm';

export const useNextActionsStore = defineStore('next-actions', {
  state: (): INextActionsState => {
    return {}
  },
  actions: {
    async create(options: ICreateNextActionOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise((resolve, reject) => {
        api.post('/next_actions', {
          next_action: {
            context_id: options.context_id,
            project_id: options.project_id,
            title: options.title,
            notes: options.notes,
            remind_me_at: options.remind_me_at,
            mental_energy_required: options.mental_energy_required,
            physical_energy_required: options.physical_energy_required,
            hard_prereq_ids: options.hard_prereq_ids,
            hard_postreq_ids: options.hard_postreq_ids
          }
        }, {
          headers: {
            Authorization: authenticationStore.getBearerToken
          }
        })
        .then((response) => {
          useRepo(NextAction).save(response.data)
          resolve(response)
        },
        (error) => {
          reject(error)
        })
      })
    },
    async delete(options: { id: number }) {
      const authenticationStore = useAuthenticationStore()
      return new Promise((resolve, reject) => {
        api.delete(`/next_actions/${options.id}`, {
          headers: {
            Authorization: authenticationStore.getBearerToken
          }
        })
        .then((response) => {
          useRepo(NextAction).destroy(options.id)
          resolve(response)
        }),
        (error: any) => {
          reject(error)
        }
      })
    },

    async update(options: IUpdateNextActionOptions) {
      const authenticationStore = useAuthenticationStore()
      return new Promise((resolve, reject) => {
        api.patch(`/next_actions/${options.id}`, {
          next_action: {
            context_id: options.context_id,
            project_id: options.project_id,
            title: options.title,
            notes: options.notes,
            remind_me_at: options.remind_me_at,
            mental_energy_required: options.mental_energy_required,
            physical_energy_required: options.physical_energy_required,
            hard_prereq_ids: options.hard_prereq_ids,
            hard_postreq_ids: options.hard_postreq_ids
          }
        }, {
          headers: {
            Authorization: authenticationStore.getBearerToken
          }
        })
        .then((response) => {
          useRepo(NextAction).save(response.data)
          resolve(response)
        }),
        (error: any) => {
          reject(error)
        }
      })
    },

    async fetchNextAction(options: { id: number }) {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get(`/next_actions/${options.id}`, {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(NextAction).save(response.data)
      return response
    },

    async fetchNextActions() {
      const authenticationStore = useAuthenticationStore()
      const response = await api.get('/next_actions', {
        headers: { Authorization: authenticationStore.getBearerToken },
        params: {}
      })
      useRepo(NextAction).fresh(response.data)
      return response
    }
  }
})