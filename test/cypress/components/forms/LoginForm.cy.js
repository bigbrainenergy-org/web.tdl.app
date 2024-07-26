import LoginForm from 'src/components/forms/LoginForm.vue'

describe('LoginForm Component', () => {
  beforeEach(() => {
    const onLoginSpy = cy.spy().as('onLoginSpy')
    cy.mount(LoginForm, { props: { onLogin: onLoginSpy } })
  })

  it('should render server input', () => {
    cy.dataCy('server').should('exist')
  })

  it('should render username input', () => {
    cy.dataCy('username').should('exist')
  })

  it('should render password input', () => {
    cy.dataCy('password').should('exist')
  })

  it('should autofocus username', () => {
    cy.dataCy('username').should('be.focused')
  })

  it('should focus password when hitting enter on username input', () => {
    cy.focused().type('{enter}')
    cy.dataCy('password').should('be.focused')
  })

  it('should emit login when hitting enter on password input', () => {
    cy.dataCy('password').type('{enter}')
    cy.get('@onLoginSpy').should('have.been.called')
  })
})
