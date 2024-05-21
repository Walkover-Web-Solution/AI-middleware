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
    },
  },
];
