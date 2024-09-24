import TaskList from 'src/components/TaskList.vue'
import { Task } from 'src/stores/tasks/task-model'

describe('<TaskList/>', () => {
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
      const onTaskClickedSpy = cy.spy().as('onTaskClickedSpy')
      cy.mount(TaskList, {
        props: {
          tasks: [
            new Task({ title: 'Task 1' }),
            new Task({ title: 'Task 2' }),
            new Task({ title: 'Task 3' })
          ],
          onTaskClicked: onTaskClickedSpy
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

    it('should emit task-clicked when task clicked', () => {
      cy.dataCy('task_item').first().click()
      cy.get('@onTaskClickedSpy').should('have.been.called')
    })
  })
})
