import registerCodeCoverageTasks from '@cypress/code-coverage/task'
import { injectQuasarDevServerConfig } from '@quasar/quasar-app-extension-testing-e2e-cypress/cct-dev-server'
import { defineConfig } from 'cypress'

module.exports = defineConfig({
  fixturesFolder: 'test/cypress/fixtures',
  screenshotsFolder: 'test/cypress/screenshots',
  videosFolder: 'test/cypress/videos',
  video: true,
  e2e: {
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config)
      return config
    },
    baseUrl: 'http://localhost:8080/',
    supportFile: 'test/cypress/support/e2e.js',
    specPattern: 'test/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  },
  component: {
    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config)
      return config
    },
    supportFile: 'test/cypress/support/component.js',
    // specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    specPattern: 'test/cypress/components/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'test/cypress/support/component-index.html',
    devServer: injectQuasarDevServerConfig()
  }
})
