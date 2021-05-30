// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { ListsStateInterface } from './state';
import { api } from 'boot/axios';
import List from '../../models/list'

const actions: ActionTree<ListsStateInterface, StateInterface> = {
  async create({ commit, getters, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/lists',
          {
            title: options.title,
            order: getters.nextOrder
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(List).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async delete({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.delete(`/lists/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Task).destroy(options.id)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async update({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch(`/lists/${options.id}`,
          {
            title: options.title
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            this.$repo(List).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async syncOrdering({ commit, rootGetters }) {
    return new Promise(
      (resolve, reject) => {
        api.patch('/lists/sync-ordering',
          {
            lists: this.$repo(List).with('tasks').orderBy('order').orderBy('title').get().map((element, index, array) => {
              return { id: element.id, order: index }
            })
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            // TODO: Does this need to be syncing?
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async fetchLists({ commit, rootGetters }) {
    const response = await api.get('/lists', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(List).fresh(response.data)
    return response
  },
};

export default actions;
