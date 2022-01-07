import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { UsersStateInterface } from './state';

const getters: GetterTree<UsersStateInterface, StateInterface> = {
  username (state) {
    return state.user.username
  },

  timeZone (state) {
    return state.user.time_zone
  },

  user (state) {
    return state.user
  },
};

export default getters;
