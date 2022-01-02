import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { NextActionsStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const nextActionsModule: Module<NextActionsStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default nextActionsModule;
