import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import cypress from 'eslint-plugin-cypress/flat'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

// See: https://typescript-eslint.io/troubleshooting/typed-linting/performance/

export default tseslint.config(
  // NOTE: Global ignores MUST be COMPLETELY by itself, or it won't work.
  {
    ignores: [
      '**/dist/*',
      '**/node_modules/*',
      '**/src-capacitor/*',
      '**/src-electron/*',
      '**/src-pwa/*',
      '.quasar',
      '.eslintrc.js',
      'eslint.config.mjs',
      'babel.config.js',
      '.postcssrc.js',
      'server.js',
    ]
  },
  // Import recommendations for all plugins
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  cypress.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        projectService: true,
        extraFileExtensions: ['.vue']
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'prefer-promise-reject-errors': 'off',

      quotes: ['warn', 'single', {
        avoidEscape: true,
      }],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'no-debugger': 'off',
    }
  }
)
