import { defineStore } from 'pinia';
import { IAuthenticationState } from './i-authentication-state';
import { api } from 'src/boot/axios';
import { ILoginOptions } from './i-login-options';

export const useAuthenticationStore = defineStore('authentication', {
  state: (): IAuthenticationState => {
    return {
      sessionToken: '',
      userId: 0
    }
  },
  getters: {
    getSessionToken: (state) => state.sessionToken,
    getBearerToken: (state) => `Bearer ${state.sessionToken}`,
    getUserId: (state) => state.userId,
    getLoggedIn: (state) => state.sessionToken !== null && typeof state.sessionToken !== 'undefined' && state.sessionToken.length > 0
  },
  actions: {
    setSessionToken(sessionToken: string) {
      this.sessionToken = sessionToken
    },
    setUserId(userId: number) {
      this.userId = userId
    },
    async login(options: ILoginOptions) {
      return new Promise((resolve, reject) => {
        api.post('/login', {
          username: options.username,
          password: options.password,
          dataType: 'json',
          contentType: 'application/json'
        })
        .then((response) => {
          this.setSessionToken(response.data.session_token)
          this.setUserId(response.data.user_id)
          resolve(response)
        }),
        (error: any) => {
          reject(error)
        }
      })
    }
  }
})