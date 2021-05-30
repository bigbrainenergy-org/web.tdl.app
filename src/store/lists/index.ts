import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { ListsStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const listsModule: Module<ListsStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default listsModule;
