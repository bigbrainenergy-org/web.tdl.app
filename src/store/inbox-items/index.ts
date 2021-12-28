import { Module } from 'vuex';
import { StateInterface } from '../index';
import state, { InboxItemsStateInterface } from './state';
import actions from './actions';
import getters from './getters';
import mutations from './mutations';

const inboxItemsModule: Module<InboxItemsStateInterface, StateInterface> = {
  namespaced: true,
  actions,
  getters,
  mutations,
  state
};

export default inboxItemsModule;
