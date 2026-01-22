import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: ["node_modules/", ".husky/", ".env", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-case-declarations": "off",
      "no-prototype-builtins": 0,
      "max-len": 0,
    },
  },
];
