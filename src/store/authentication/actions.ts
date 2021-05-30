import { ActionTree } from 'vuex';
import { StateInterface } from '../index';
import { AuthenticationStateInterface } from './state';

const actions: ActionTree<AuthenticationStateInterface, StateInterface> = {
  someAction (/* context */) {
    // your code
  }
};

export default actions;
