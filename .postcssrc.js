/* eslint-disable */
// https://github.com/michael-ciniawsky/postcss-load-config

import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    // to edit target browsers: use "browserslist" field in package.json
    autoprefixer({
      // overrideBrowserslist: [
      //   'last 4 Chrome versions',
      //   'last 4 Firefox versions',
      //   'last 4 Edge versions',
      //   'last 4 Safari versions',
      //   'last 4 Android versions',
      //   'last 4 ChromeAndroid versions',
      //   'last 4 FirefoxAndroid versions',
      //   'last 4 iOS versions'
      // ]
    })
  ]
}
