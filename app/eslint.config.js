const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        _: 'readonly'
      }
    },
    rules: {
      'eol-last': ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always']
    }
  }
];
