import PasswordChangeForm from '../../forms/PasswordChangeForm.vue'

describe('Password Change Form Component', () => {
  it('should mount component with current password input', () => {
    cy.mount(PasswordChangeForm)
    cy.dataCy('current_password').should('exist')
  })

  it('should mount component with new password input', () => {
    cy.mount(PasswordChangeForm)
    cy.dataCy('new_password').should('exist')
  })

  it('should mount component with confirm password input', () => {
    cy.mount(PasswordChangeForm)
    cy.dataCy('confirm_password').should('exist')
  })
})
