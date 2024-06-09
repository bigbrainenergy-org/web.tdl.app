import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LanguageSwitcher from 'src/components/LanguageSwitcher.vue';

installQuasarPlugin();

describe('Password Change Form Component', () => {
  it('should mount component with language switcher input', () => {
    const wrapper = mount(LanguageSwitcher)
    expect(wrapper.find('[name="language_switcher"]').exists()).toBeTruthy()
  });
});
