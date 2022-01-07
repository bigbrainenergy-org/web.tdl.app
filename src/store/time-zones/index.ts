import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { TimeZonesStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const timeZonesModule: Module<TimeZonesStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default timeZonesModule;
