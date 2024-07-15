import { Task } from 'src/stores/tasks/task'
import TaskList from '../TaskList.vue'

describe('Password Change Form Component', () => {
  context('when passed no tasks', () => {
    beforeEach(() => {
      cy.mount(TaskList)
    })

    it('should mount component with task list', () => {
      cy.dataCy('task_list').should('exist')
    })

    it('should have empty list message', () => {
      cy.dataCy('empty_list_message').should('exist')
    })

    it('should have no task items', () => {
      cy.dataCy('task_item').should('have.length', 0)
    })
  })

  context('when passed three tasks', () => {
    beforeEach(() => {
      cy.mount(TaskList, {
        props: {
          tasks: [
            new Task({ title: 'Task 1' }),
            new Task({ title: 'Task 2' }),
            new Task({ title: 'Task 3' })
          ]
        }
      })
    })

    it('should mount component with task list', () => {
      cy.dataCy('task_list').should('exist')
    })

    it('should not have empty list message', () => {
      cy.dataCy('empty_list_message').should('not.exist')
    })

    it('should have 3 task items', () => {
      cy.dataCy('task_item').should('have.length', 3)
    })
  })
})
