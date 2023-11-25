import { defineStore } from 'pinia';
import { api } from 'src/boot/axios';
import { Utils } from 'src/util';

interface IAuthenticationState {
  sessionToken: string
  userId: number
}

interface ILoginOptions {
  username: string
  password: string
}

export const useAuthenticationStore = defineStore('authentication', {
  state: (): IAuthenticationState => {
    return {
      sessionToken: '',
      userId: -1,
    };
  },
  persist: true,
  getters: {
    bearerToken: (state) => `Bearer ${state.sessionToken}`,
    isLoggedIn: (state) =>
      state.sessionToken !== null &&
      typeof state.sessionToken !== 'undefined' &&
      state.sessionToken.length > 0,
  },
  actions: {
    async login(options: ILoginOptions) {
      return new Promise((resolve) => {
        api.post('/login', options).then((response) => {
          this.sessionToken = response.data.session_token
          this.userId = response.data.user_id
          resolve(response);
        }),
          Utils.handleError('aaaaa')
      });
    },
  },
});
