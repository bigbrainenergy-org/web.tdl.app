import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { AuthenticationStateInterface } from './state';

const getters: GetterTree<AuthenticationStateInterface, StateInterface> = {
  sessionToken (state) {
    return state.sessionToken;
  },

  bearerToken (state) {
    return `Bearer ${state.sessionToken}`;
  },

  loggedIn (state) {
    return state.sessionToken !== ''
  },
};

export default getters;
