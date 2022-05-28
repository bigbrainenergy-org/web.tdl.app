// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { ContextsStateInterface } from './state';
import { api } from 'boot/axios';
import Context from '../../models/context'

const actions: ActionTree<ContextsStateInterface, StateInterface> = {
  async create({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/contexts',
          {
            title: options.title,
            color: options.color
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Context).save(response.data)
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
        api.delete(`/contexts/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Context).destroy(options.id)
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
        api.patch(`/contexts/${options.id}`,
          {
            title: options.title,
            color: options.color
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(Context).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async fetchContexts({ rootGetters }) {
    const response = await api.get('/contexts', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(Context).fresh(response.data)
    return response
  },
};

export default actions;
