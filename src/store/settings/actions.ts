import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { SettingsStateInterface } from './state';
import { api } from 'boot/axios';

const actions: ActionTree<SettingsStateInterface, StateInterface> = {
  async fetchUsername({ commit, rootGetters }) {
    const response = await api.get('/username', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    commit('setUsername', response.data.username)
    return response
  },

  async fetchTimeZone({ commit, rootGetters }) {
    const response = await api.get('/time-zone', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    commit('setTimeZone', response.data.time_zone)
    return response
  },

  async fetchTimeZones({ commit, rootGetters }) {
    const response = await api.get('/time-zones', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    commit('setTimeZones', response.data)
    return response
  },

  async updateTimeZone({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.patch('/time-zone',
          {
            time_zone: options.timeZone
          },
          {
            headers: {
              Authorization: rootGetters['authentication/bearerToken']
            }
          }
        ).
        then(
          (response) => {
            commit('setTimeZone', response.data.time_zone)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  }
};

export default actions;
