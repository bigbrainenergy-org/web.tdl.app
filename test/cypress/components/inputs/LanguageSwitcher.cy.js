import LanguageSwitcher from 'src/components/inputs/LanguageSwitcher.vue'

describe('<LanguageSwitcher/>', () => {
  beforeEach(() => {
    cy.mount(LanguageSwitcher)
  })

  it('should have language switcher input', () => {
    cy.dataCy('language_switcher').should('exist')
  })

  // TODO: See if we can somehow access i18n directly to test the current locale
  //       Alternatively, emit an event and test for that instead
  it.skip('should change the language when switched to Japanese', () => {
    cy.dataCy('language_switcher').should('exist')
    cy.dataCy('language_switcher').select('日本語')
    cy.dataCy('language_switcher').within(() => {
      cy.get('span').should('have.text', '日本語')
    })
  })

  it('should default to English', () => {
    // cy.dataCy('language_switcher').should('exist')
    // cy.dataCy('language_switcher').should('have.value', 'en-US')
    cy.dataCy('language_switcher').within(() => {
      cy.get('span').should('have.text', 'English')
    })
    // cy.dataCy('language_switcher').should('have.value', 'English')
    // cy.dataCy('language_switcher').should('contain.text', 'English')
  })
})
