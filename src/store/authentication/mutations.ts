import { MutationTree } from 'vuex';
import { AuthenticationStateInterface } from './state';

const mutation: MutationTree<AuthenticationStateInterface> = {
  setSessionToken(state, sessionToken: string) {
    state.sessionToken = sessionToken
  }
};

export default mutation;
