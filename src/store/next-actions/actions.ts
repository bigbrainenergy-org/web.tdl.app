// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { NextActionsStateInterface } from './state';
import { api } from 'boot/axios';
import NextAction from '../../models/next_action'

const actions: ActionTree<NextActionsStateInterface, StateInterface> = {
  async create({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/next_actions',
          {
            title: options.title,
            notes: options.notes,
            remind_me_at: options.remind_me_at,
            context_id: options.context_id,
            project_id: options.project_id,
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          },
        ).
        then(
          (response) => {
            this.$repo(NextAction).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async delete({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.delete(`/next_actions/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(NextAction).destroy(options.id)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async update({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/next_actions/${options.id}`,
          {
            title: options.title,
            notes: options.notes,
            remind_me_at: options.remind_me_at,
            context_id: options.context_id,
            project_id: options.project_id,
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          },
        ).
        then(
          (response) => {
            this.$repo(NextAction).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async fetchNextActions({ rootGetters }) {
    const response = await api.get('/next_actions', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(NextAction).fresh(response.data)
    return response
  },
};

export default actions;
