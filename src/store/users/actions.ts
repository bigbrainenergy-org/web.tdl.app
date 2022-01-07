import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { UsersStateInterface } from './state';
import { api } from 'boot/axios';

const actions: ActionTree<UsersStateInterface, StateInterface> = {
  async fetchUser({ commit, rootGetters }) {
    const userId = rootGetters['authentication/userId']
    const bearerToken = rootGetters['authentication/bearerToken']

    const response = await api.get(`/users/${userId}`, {
      headers: { Authorization: bearerToken },
      params: {}
    })
    commit('setUser', response.data)
    return response
  },

  async updateUser({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        const userId = rootGetters['authentication/userId']
        const bearerToken = rootGetters['authentication/bearerToken']

        api.patch(`/users/${userId}`,
          {
            time_zone: options.timeZone
          },
          {
            headers: {
              Authorization: bearerToken
            }
          }
        ).
        then(
          (response) => {
            commit('setUser', response.data)
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
