describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  // FIXME: This appears to be flaky on GitHub actions, not sure why
  it('should allow logging in the user with good credentials', { retry: 2 }, () => {
    // Enter valid username and password
    cy.dataCy('username').type('AzureDiamond')
    cy.dataCy('password').type('hunter2')
    // Assume valid login info
    cy.intercept(
      {
        method: 'POST',
        url: '/login',
        hostname: 'localhost'
      },
      { fixture: 'login_success.json' }
      // { statusCode: 200, body: { session_token: 'asdf', user_id: 1234 } }
    )
    // Click login
    cy.dataCy('login').click()
    // Expect to have logged in successfully
    cy.dataCy('tasks_title').should('exist')
  })

  it('should reject invalid credentials')
})
