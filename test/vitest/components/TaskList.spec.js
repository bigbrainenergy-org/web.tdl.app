import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import TaskList from 'src/components/TaskList.vue'

installQuasarPlugin()

describe('Task List Component', () => {
  it('should mount component with task list', () => {
    const wrapper = mount(TaskList)
    expect(wrapper.find('[data-cy="task_list"]').exists()).toBeTruthy()
  })

  it('should say nothing yet when no passed tasks', () => {
    const wrapper = mount(TaskList)
    expect(wrapper.find('[data-cy="no_tasks_item"]').exists()).toBeTruthy()
  })

  // TODO: Fails due to IntersectionObserver mock not working properly
  it.todo('should have 3 tasks when passed 3 tasks', () => {
    const wrapper = mount(TaskList, {
      props: {
        tasks: [
          new Task({ title: 'Task 1' }),
          new Task({ title: 'Task 2' }),
          new Task({ title: 'Task 3' })
        ]
      }
    })

    expect(wrapper.findAll('.q-item')).toHaveLength(3)
  })
})
