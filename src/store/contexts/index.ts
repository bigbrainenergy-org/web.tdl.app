import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { ContextsStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const contextsModule: Module<ContextsStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default contextsModule;
