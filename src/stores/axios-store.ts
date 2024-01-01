import axios, { AxiosInstance } from 'axios'
import { defineStore } from 'pinia'

interface IServerUrlState {
  url?: string
  api?: AxiosInstance
}

export const useAxiosStore = defineStore('axios', {
  state: (): IServerUrlState => {
    return {
      url: undefined,
      api: undefined
    }
  },
  persist: true,
  actions: {
    URL(url?: string) {
      if(typeof url !== 'undefined') this.url = url
      if(typeof this.url === 'undefined') {
        if(!process.env.DEV) this.url = 'https://api.tdl.app'
        if(process.env.MODE === 'capacitor') this.url = 'https://api.tdl.app'
        else this.url = 'http://localhost:3000'
      }
      return this.url
    },
    axios(baseURL?: string): AxiosInstance {
      if(typeof baseURL !== 'undefined') this.api = axios.create({ baseURL: this.URL(baseURL) })
      if(typeof this.api === 'undefined') this.api = axios.create({ baseURL: this.URL(baseURL) })
      return this.api
    }
  }
})