import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LoginForm from 'src/components/forms/LoginForm.vue'
import { nextTick } from 'process'

installQuasarPlugin()

describe('Password Change Form Component', () => {
  it('should render server input', () => {
    const wrapper = mount(LoginForm)
    expect(wrapper.find('[data-cy="server"]').exists()).toBeTruthy()
  })

  it('should render username input', () => {
    const wrapper = mount(LoginForm)
    expect(wrapper.find('[data-cy="username"]').exists()).toBeTruthy()
  })

  it('should render password input', () => {
    const wrapper = mount(LoginForm)
    expect(wrapper.find('[data-cy="password"]').exists()).toBeTruthy()
  })

  it('should autofocus username', () => {
    const wrapper = mount(LoginForm, { attachTo: document.body })
    expect(document.activeElement).toBe(wrapper.find('[data-cy="username"]').element)
  })

  it('should focus password when hitting enter on username input', () => {
    const wrapper = mount(LoginForm, { attachTo: document.body })
    wrapper.find('[data-cy="username"]').trigger('keyup.enter')
    expect(document.activeElement).toBe(wrapper.find('[data-cy="password"]').element)
  })

  it('should emit login when hitting enter on password input', () => {
    const wrapper = mount(LoginForm)
    wrapper.find('[data-cy="password"]').trigger('keyup.enter')
    expect(wrapper.emitted()).toHaveProperty('login')
  })
})
