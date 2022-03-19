import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
let api: AxiosInstance
if(!process.env.DEV)
  api = axios.create({ baseURL: 'https://api.tdl.app' });
else if(process.env.MODE === 'capacitor')
  api = axios.create({ baseURL: 'http://10.0.2.2:3000' });
else api = axios.create({ baseURL: 'https://localhost:3000' });

// Technically we don't need to tell it about the store state interface, but
// knowing that this is possible is very useful in itself.
export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
