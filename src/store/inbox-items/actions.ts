// @ts-nocheck
import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { InboxItemsStateInterface } from './state';
import { api } from 'boot/axios';
import InboxItem from '../../models/inbox_item'

const actions: ActionTree<InboxItemsStateInterface, StateInterface> = {
  async create({ rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/inbox_items',
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
            this.$repo(InboxItem).save(response.data)
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
        api.delete(`/inbox_items/${options.id}`, {
          headers: {
            Authorization: rootGetters['authentication/bearerToken']
          }
        }).
        then(
          (response) => {
            this.$repo(InboxItem).destroy(options.id)
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
        api.patch(`/inbox_items/${options.id}`,
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
            this.$repo(InboxItem).save(response.data)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },

  async fetchInboxItems({ rootGetters }) {
    const response = await api.get('/inbox_items', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    this.$repo(InboxItem).fresh(response.data)
    return response
  },
};

export default actions;
