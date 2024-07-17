import { Task } from 'src/stores/tasks/task'
import TaskItem from '../TaskItem.vue'

describe('TaskItem Component', () => {
  it('should mount component with task item', () => {
    cy.mount(TaskItem, {
      props: {
        task: new Task({ title: 'Example Task' })
      }
    })
    cy.dataCy('task_item').should('exist')
  })

  it('should render task title', () => {
    cy.mount(TaskItem, {
      props: {
        task: new Task({ title: 'Example Task' })
      }
    })
    cy.dataCy('task_item_title').should('have.text', 'Example Task')
  })

  it('should render notes tooltip when task has notes', () => {
    cy.mount(TaskItem, {
      props: {
        task: new Task({ title: 'Example Task', notes: 'Some notes' })
      }
    })
    cy.dataCy('notes_indicator').should('exist')
  })

  it('should not render notes tooltip when task has no notes', () => {
    cy.mount(TaskItem, {
      props: {
        task: new Task({ title: 'Example Task' })
      }
    })
    cy.dataCy('notes_indicator').should('not.exist')
  })
})
