import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { LocalSettingsStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const localSettingsModule: Module<LocalSettingsStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default localSettingsModule;
