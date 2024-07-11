import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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

  it('should have 3 tasks when passed 3 tasks', () => {
    const wrapper = mount(TaskList, {
      props: {
        tasks: [{ title: 'something' }]
      }
    })

    expect(wrapper.findAll('.q-item')).toHaveLength(3)
  })
})
