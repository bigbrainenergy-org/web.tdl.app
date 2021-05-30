import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { AuthenticationStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const authenticationModule: Module<AuthenticationStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default authenticationModule;
