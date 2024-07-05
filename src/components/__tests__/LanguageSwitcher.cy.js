import LanguageSwitcher from '../LanguageSwitcher.vue'

describe('Language Switcher', () => {
  it('should have language switcher input', () => {
    cy.mount(LanguageSwitcher)

    cy.dataCy('language_switcher').should('exist')
  })
})
