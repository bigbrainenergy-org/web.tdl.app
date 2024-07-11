describe('Settings', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/settings')
  })
  it('should allow switching the time zone')
  it('should allow switching language')
  it('should allow switching the background image')
  it('should allow changing notification settings')
  it('should allow changing focus mode settings')
  it('should allow changing your password')
  it('should mention the source code link', () => {
    cy.dataCy('source-code-link').should('exist')
  })
})
