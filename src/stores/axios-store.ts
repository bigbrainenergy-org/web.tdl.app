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
      if(typeof url !== 'undefined') {
      	this.url = url
      	console.debug(`url changed to ${url}`)
      }
      else if(typeof this.url === 'undefined') {
      	console.warn('url was undefined, revert to default options')
        if(!process.env.DEV) {
          this.url = 'https://api.tdl.app'
          console.debug(`url is now ${this.url}`)
		}
        if(process.env.MODE === 'capacitor') {
          this.url = 'https://api.tdl.app'
          console.debug(`url is now ${this.url}`)
        }
        else {
          this.url = 'http://localhost:3000'
          console.debug(`url is now ${this.url}`)
        }
      }
      return this.url
    },
    axios(baseURL?: string): AxiosInstance {
      if(typeof baseURL !== 'undefined') this.api = axios.create({ baseURL: this.URL(baseURL) })
      else if(typeof this.api === 'undefined') this.api = axios.create({ baseURL: this.URL(baseURL) })
      return this.api
    }
  }
})
