import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['assets/js/min/**', 'node_modules/**', 'tests/node_modules/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-inner-declarations': 'off',
      'no-console': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.js', 'playwright.config.js'],
    languageOptions: { globals: { test: 'readonly', expect: 'readonly' } },
  },
];
