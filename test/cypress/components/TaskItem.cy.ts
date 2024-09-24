import TaskItem from 'src/components/TaskItem.vue'
import { Task } from 'src/stores/tasks/task-model'

describe('<TaskItem/>', () => {
  context('when using task with only title', () => {
    beforeEach(() => {
      const onTaskClickedSpy = cy.spy().as('onTaskClickedSpy')
      cy.mount(TaskItem, {
        props: {
          task: new Task({ title: 'Example Task' }),
          onTaskClicked: onTaskClickedSpy
        }
      })
    })

    it('should mount component with task item', () => {
      cy.dataCy('task_item').should('exist')
    })

    it('should render task title', () => {
      cy.dataCy('task_item_title').should('have.text', 'Example Task')
    })

    it('should not render notes tooltip', () => {
      cy.dataCy('notes_indicator').should('not.exist')
    })

    it('should emit task-selected when clicked', () => {
      cy.dataCy('task_item').click()
      cy.get('@onTaskClickedSpy').should('have.been.called')
    })
  })

  context('when task has notes', () => {
    beforeEach(() => {
      cy.mount(TaskItem, {
        props: {
          task: new Task({ title: 'Example Task', notes: 'Some notes' })
        }
      })
    })

    it('should render notes tooltip when task has notes', () => {
      cy.dataCy('notes_indicator').should('exist')
    })
  })
})
