describe('Tasks page', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should allow creating a task', () => {
    cy.dataCy('create_task_button').click()
    cy.dataCy('create_task_dialog').should('exist')
    cy.dataCy('task_title_input').type('Task 1')
    cy.intercept('POST', '/tasks', { fixture: 'create_task_success.json' })
    cy.dataCy('create_task_submit').click()
    cy.dataCy('close_dialog').click()
    cy.dataCy('task_item').should('have.length', 1)
    cy.dataCy('task_item_title').should('have.text', 'Task 1')
  })

  it('should allow editing a task', () => {
    cy.createTask()
    cy.dataCy('task_item').click()
    cy.dataCy('update_task_dialog').should('exist')
    cy.fixture('create_task_success.json').then((task) => {
      task.title = 'Task 1 but better'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      cy.intercept('PATCH', '/tasks/1', task)
    })
    cy.dataCy('task_title_input').type('{selectall}{del}Task 1 but better{enter}')
    cy.dataCy('close_dialog').click()
    cy.dataCy('task_item_title').should('have.text', 'Task 1 but better')
  })

  it('should allow filtering current tasks by their attributes')

  it('should allow sorting current tasks by their attributes')
})
