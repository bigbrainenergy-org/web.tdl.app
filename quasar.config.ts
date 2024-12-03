/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { configure } from 'quasar/wrappers'
import { resolve } from 'path'
import { mergeConfig } from 'vite'
import { defineConfig } from '#q-app/wrappers'

export default defineConfig((/* ctx */) => {
  return {
    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['i18n'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: ['app.sass'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
      'fontawesome-v6'
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },

      typescript: {
        strict: true,
        vueShim: true,
        // extendTSConfig (tsConfig) {
        //   // hooks for tsconfig
        // }
      },

      vueRouterMode: 'history', // available values: 'hash', 'history'

      vitePlugins: [
        //   ['@intlify/unplugin-vue-i18n', {
        //     // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
        //     // compositionOnly: false,
  
        //     // if you want to use named tokens in your Vue I18n messages, such as 'Hello {name}',
        //     // you need to set `runtimeOnly: false`
        //     // runtimeOnly: false,
  
        //     // you need to set i18n resource including paths !
        //     include: resolve(__dirname, './src/i18n/**')
        //   }]
        ['vite-plugin-checker', {
          vueTsc: true,
          eslint: {
            useFlatConfig: true,
            lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"'
          }
        }, { server: false }]
      ],
      extendViteConf (viteConf) {
        const viteConfBuild = viteConf.build
        if(typeof viteConfBuild === 'undefined') throw new Error('viteConf build undefined.')
        viteConf.build = mergeConfig(viteConfBuild, {
          sourcemap: true
        })
      },
      
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      // https: false,
      port: 8080,
      open: true // opens browser window automatically
    },

    framework: {
      config: {
        dark: true,
        loadingBar: {
          color: 'purple',
          position: 'bottom',
          size: '5px'
        }
      },
      plugins: ['Dialog', 'Notify', 'LoadingBar'],
      iconSet: 'fontawesome-v6'
    },

    animations: [],

    cordova: {},
    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      preloadScripts: ['electron-preload'],
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'web.tdl.app'
      }
    },
    bex: {
      extraScripts: []
    }
  }
})
