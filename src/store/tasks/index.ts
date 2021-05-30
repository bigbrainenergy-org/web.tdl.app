import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { TasksStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const tasksModule: Module<TasksStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default tasksModule;
