import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { SubtasksStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const subtasksModule: Module<SubtasksStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default subtasksModule;
