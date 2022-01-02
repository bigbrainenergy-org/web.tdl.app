import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { WaitingForsStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const waitingForsModule: Module<WaitingForsStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default waitingForsModule;
