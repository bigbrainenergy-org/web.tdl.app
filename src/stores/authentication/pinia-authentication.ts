import { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { useAxiosStore } from '../axios-store'

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
      const api = useAxiosStore().axios()
      return new Promise(
        (resolve, reject) => {
          api.post('/login', {
            username: options.username,
            password: options.password,
            dataType: 'json',
            contentType: 'application/json'
          }).
          then(
            (response) => {
              this.sessionToken = response.data.session_token
              this.userId = response.data.user_id
              resolve(response)
            },
            (error: Error | AxiosError) => {
              reject(error)
            }
          )
        }
      )
    },
  },
});
