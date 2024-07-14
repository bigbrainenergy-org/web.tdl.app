import { Task } from 'src/stores/tasks/task'
import TaskList from '../TaskList.vue'

describe('Password Change Form Component', () => {
  it('should mount component with task list', () => {
    cy.mount(TaskList)
    cy.dataCy('task_list').should('exist')
  })

  it('should say nothing yet when no passed tasks', () => {
    cy.mount(TaskList)
    cy.dataCy('no_tasks_item').should('exist')
  })

  it('should have 3 tasks when passed 3 tasks', () => {
    cy.mount(TaskList, {
      props: {
        tasks: [
          new Task({ title: 'Task 1' }),
          new Task({ title: 'Task 2' }),
          new Task({ title: 'Task 3' })
        ]
      }
    })
    cy.dataCy('task_item').should('have.length', 3)
  })
})
