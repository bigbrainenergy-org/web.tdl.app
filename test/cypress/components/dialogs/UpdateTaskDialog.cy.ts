// import UpdateTaskDialog from 'src/components/dialogs/UpdateTaskDialog.vue'
// import DialogWrapper from '../../wrappers/DialogWrapper.vue'
// import { Task } from 'src/stores/tasks/task-model'
// import { createTask } from 'src/utils/task-utils'
// import { createPinia, setActivePinia } from 'pinia'
// import { useTaskStore } from 'src/stores/tasks/task-store'

describe('UpdateTaskDialog', () => {
  // beforeEach(() => {
  //   // setActivePinia(createPinia())
  //   // cy.intercept('POST', '/tasks', { fixture: 'create_task_success.json' })
  //   // const task = createTask({ title: 'Task 1' }) // FIXME: This should be returning the task created, but it doesn't
  //   cy.mount(DialogWrapper, {
  //     props: {
  //       component: UpdateTaskDialog,
  //       componentProps: {
  //         // task: task
  //         // task: useTaskStore().hardGet(1) // This is way too tightly coupled atm
  //         task: new Task({ title: 'Task 1' })
  //       }
  //     }
  //   })
  // })

  // it('should allow editing title', () => {
  //   cy.fixture('create_task_success.json').then((task) => {
  //     task.title = 'Task 1 but better'
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  //     cy.intercept('PATCH', '/tasks/1', task)
  //   })
  //   cy.dataCy('task_title_input').type('{selectall}{del}Task 1 but better{enter}')
  //   cy.dataCy('task_title').should('have.text', 'Task 1 but better')
  // })

  it('should allow editing notes')
  it('should allow editing order')
  it('should allow editing completed')
  it('should allow editing remind me at')
  it('should allow editing mental energy required')
  it('should allow editing physical energy required')
  it('should allow editing list')
  it('should allow editing status')
  it('should allow editing delegated')
  it('should allow editing deadline at')
  it('should allow editing task duration in minutes')
})
