import { Task } from 'src/stores/tasks/task'
import DependencyList from 'src/components/DependencyList.vue'

describe('<DependencyList/>', () => {
  beforeEach(() => {
    cy.mount(DependencyList)
  })

  it('should render dependency list', () => {
    cy.dataCy('dependency_list').should('exist')
  })
})
