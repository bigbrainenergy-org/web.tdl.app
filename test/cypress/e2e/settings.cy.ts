describe('Settings', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/settings')
  })
  it('should allow switching the time zone')
  it('should allow switching language', () => {
    cy.dataCy('settings_title').should('have.text', 'Settings')
    cy.dataCy('language_switcher').select('日本語')
    cy.dataCy('settings_title').should('have.text', '設定')
  })
  it('should allow switching the background image')
  it('should allow changing notification settings')
  it('should allow changing focus mode settings')
  it('should allow changing your password')
  it('should mention the source code link', () => {
    cy.dataCy('source_code_link').should('exist')
  })
})
