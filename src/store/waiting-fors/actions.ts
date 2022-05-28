// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { WaitingForsStateInterface } from './state';
import { api } from 'boot/axios';
import WaitingFor from '../../models/waiting_for'

const actions: ActionTree<WaitingForsStateInterface, StateInterface> = {
  async create({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/waiting_fors',
          {
            title: options.title,
            notes: options.notes
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(WaitingFor).save(response.data)
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
        api.delete(`/waiting_fors/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(WaitingFor).destroy(options.id)
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
        api.patch(`/waiting_fors/${options.id}`,
          {
            title: options.title,
            notes: options.notes
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(WaitingFor).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async fetchWaitingFors({ rootGetters }) {
    const response = await api.get('/waiting_fors', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(WaitingFor).fresh(response.data)
    return response
  },
};

export default actions;
