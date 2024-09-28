describe('Home page', () => {
  context('when logged in', () => {
    beforeEach(() => {
      cy.login()
      cy.visit('/')
    })

    it('should take you to the tasks page', () => {
      cy.title().should('include', 'List | TDL App')
      cy.url().should('include', '/list')
    })
  })

  context('when not logged in', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('should take you to the login page', () => {
      cy.title().should('include', 'TDL App')
      cy.url().should('include', '/login')
    })
  })
})
