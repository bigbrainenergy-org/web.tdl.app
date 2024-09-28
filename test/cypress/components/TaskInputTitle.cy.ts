import TaskInputTitle from 'src/components/TaskInputTitle.vue'
import { Task } from 'src/stores/tasks/task-model'

describe('<TaskInputTitle/>', () => {
  beforeEach(() => {
    const task = new Task({ title: 'Example Task' })
    // FIXME: Cypress doesn't support onUpdate:task for some godsforsaken reason
    const onChangeSpy = cy.spy().as('onChangeSpy')
    cy.mount(TaskInputTitle, {
      props: {
        task: task,
        onChange: onChangeSpy
      }
    })
  })

  it('should mount component with task item', () => {
    cy.dataCy('task_title_input').should('exist')
  })

  it('should update v-model when enter key is pressed', () => {
    cy.dataCy('task_title_input').type('{selectall}{del}Example Task but better{enter}')
    cy.get('@onChangeSpy').should('have.been.called')
  })
})
