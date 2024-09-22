/// <reference types="cypress" />

// https://docs.cypress.io/guides/tooling/typescript-support
// https://stackoverflow.com/a/73018517

declare namespace Cypress {
  interface Chainable<Subject = any> {
    login(): Chainable<any>;
    createTask(): Chainable<any>;
  }
}
