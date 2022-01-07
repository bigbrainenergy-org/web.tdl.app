import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { UsersStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const usersModule: Module<UsersStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default usersModule;
