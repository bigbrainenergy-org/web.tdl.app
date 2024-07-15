// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// DO NOT REMOVE
// Imports Quasar Cypress AE predefined commands
import { registerCommands } from '@quasar/quasar-app-extension-testing-e2e-cypress'
registerCommands()

// Our custom commands

// TODO: Dynamic data using fixture override: https://docs.cypress.io/api/commands/fixture
Cypress.Commands.add('login', () => {
  cy.intercept('POST', '/login', { fixture: 'login_success.json' })
  cy.intercept('GET', '/users/*', { fixture: 'user.json' }).as('fetchUser')
  // cy.intercept('GET', '/users', { fixture: 'users.json' })
  cy.intercept('GET', '/tasks', { fixture: 'tasks.json' })
  cy.intercept('GET', '/lists', { fixture: 'lists.json' })
  cy.intercept('GET', '/time-zones', { fixture: 'time-zones.json' })
  cy.visit('/login')
  cy.dataCy('username').type('AzureDiamond')
  cy.dataCy('password').type('hunter2')
  cy.dataCy('login').click()
  // REVIEW: Breaks if we don't wait
  cy.wait('@fetchUser').then((interception) => {
    assert.isNotNull(interception.response.body, 'User has data')
  })
})
