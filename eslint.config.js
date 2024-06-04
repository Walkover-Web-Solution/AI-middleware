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
      'no-prototype-builtins': 0,
      "max-len": 0
    },
  },
];
