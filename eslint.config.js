import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-case-declarations': 'off',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-plusplus': 0,
    'no-console': ['error', { allow: ['error', 'log'] }],
    camelcase: 'off',
    'no-param-reassign': 0,
    'object-curly-newline': 0,
    'no-underscore-dangle': 0,
    'no-use-before-define': 0,
    'consistent-return': 0,
    'no-nested-ternary': 0,
    'no-return-await': 0,
    'no-array-constructor': 0,
    'no-await-in-loop': 0,
    'no-continue': 0,
    'no-unsafe-optional-chaining': 0,
    'no-restricted-syntax': 0,
    'no-multi-assign': 0,
    'array-callback-return': 0,
    'no-prototype-builtins': 0,
    'no-shadow': 0,
    'no-loop-func': 0,
    // 'no-unused-vars': 0,
    // 'no-undef': 0,
    'no-unsafe-finally': 0,
    "max-len" : 0
    },
  },
];
