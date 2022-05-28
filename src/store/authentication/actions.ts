import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { AuthenticationStateInterface } from './state';
import { api } from 'boot/axios';

const actions: ActionTree<AuthenticationStateInterface, StateInterface> = {
  async login({ commit, rootGetters }, options) {
    return new Promise(
      (resolve, reject) => {
        api.post('/login', {
          username: options.username,
          password: options.password,
          dataType: 'json',
          contentType: 'application/json'
        }).
        then(
          (response) => {
            commit('setSessionToken', response.data.session_token)
            commit('setUserId', response.data.user_id)
            resolve(response)
          },
          (error) => {
            reject(error)
          }
        )
      }
    )
  },
}

export default actions;
