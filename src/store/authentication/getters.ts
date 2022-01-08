import { GetterTree } from 'vuex';
import { StateInterface } from '../index';
import { AuthenticationStateInterface } from './state';

const getters: GetterTree<AuthenticationStateInterface, StateInterface> = {
  sessionToken (state) {
    return state.sessionToken
  },

  bearerToken (state) {
    return `Bearer ${state.sessionToken}`
  },

  userId (state) {
    return state.userId
  },

  loggedIn (state) {
    return (
      state.sessionToken !== null &&
      state.sessionToken.length > 0
    )
  },
};

export default getters;
