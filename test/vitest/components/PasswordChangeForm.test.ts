import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordChangeForm from 'src/components/PasswordChangeForm.vue';

installQuasarPlugin();

describe('Password Change Form Component', () => {
  it('should mount component with current password input', () => {
    const wrapper = mount(PasswordChangeForm)
    expect(wrapper.find('[name="current_password"]').exists()).toBeTruthy()
  });

  it('should mount component with new password input', () => {
    const wrapper = mount(PasswordChangeForm)
    expect(wrapper.find('[name="new_password"]').exists()).toBeTruthy()
  });

  it('should mount component with confirm password input', () => {
    const wrapper = mount(PasswordChangeForm)
    expect(wrapper.find('[name="confirm_password"]').exists()).toBeTruthy()
  });
});
