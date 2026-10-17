import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['old-references/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['public/js/**/*.js'],
    languageOptions: { sourceType: 'module', globals: globals.browser },
  },
  {
    files: ['public/sw.js'],
    languageOptions: { sourceType: 'script', globals: globals.serviceworker },
  },
  {
    files: ['api/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', '*.config.js', 'middleware.js'],
    languageOptions: { sourceType: 'module', globals: globals.node },
  },
  {
    files: ['tests/e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
