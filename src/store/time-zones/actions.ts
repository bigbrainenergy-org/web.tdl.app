import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { TimeZonesStateInterface } from './state';
import { api } from 'boot/axios';

const actions: ActionTree<TimeZonesStateInterface, StateInterface> = {
  async fetchTimeZones({ commit, rootGetters }) {
    const response = await api.get('/time-zones', {
      headers: { Authorization: rootGetters['authentication/bearerToken'] },
      params: {}
    })
    commit('setTimeZones', response.data)
    return response
  },
};

export default actions;
