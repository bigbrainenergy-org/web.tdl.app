import LanguageSwitcher from '../inputs/LanguageSwitcher.vue'

describe('Language Switcher', () => {
  before(() => {
    cy.mount(LanguageSwitcher)
  })
  it('should have language switcher input', () => {
    cy.dataCy('language_switcher').should('exist')
  })

  // it('should default to English', () => {
  //   cy.data
  // })
})
