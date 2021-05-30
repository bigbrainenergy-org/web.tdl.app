// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { TagsStateInterface } from './state';
import { api } from 'boot/axios';
import Tag from '../../models/tag'

const actions: ActionTree<TagsStateInterface, StateInterface> = {
  async create({ commit, getters, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/tags',
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
            this.$repo(Tag).save(response.data)
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
        api.delete(`/tags/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(Tag).destroy(options.id)
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
        api.patch(`/tags/${options.id}`,
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
            this.$repo(Tag).save(response.data)
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
        api.patch('/tags/sync-ordering',
          {
            tags: this.$repo(Tag).orderBy('order').orderBy('title').get().map(
              (element, index, array) => {
                return { id: element.id, order: index }
              }
            )
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

  async fetchTags({ commit, rootGetters }) {
    const response = await api.get('/tags', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(Tag).fresh(response.data)
    return response
  },
};

export default actions;
