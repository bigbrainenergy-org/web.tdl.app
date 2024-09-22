import PasswordChangeForm from 'src/components/forms/PasswordChangeForm.vue'

describe('Password Change Form Component', () => {
  beforeEach(() => {
    cy.mount(PasswordChangeForm)
  })

  it('should mount component with current password input', () => {
    cy.dataCy('current_password').should('exist')
  })

  it('should mount component with new password input', () => {
    cy.dataCy('new_password').should('exist')
  })

  it('should mount component with confirm password input', () => {
    cy.dataCy('confirm_password').should('exist')
  })
})
