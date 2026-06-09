// Package-local flat ESLint config for @open-revops/api.
//
// The root eslint.config.js is an import-free base (espree) that cannot parse
// TypeScript syntax, and cross-cutting root tooling is owned centrally
// (.claude/rules/00-scope-and-non-goals.md). So this package brings its own
// TypeScript-aware lint via typescript-eslint, scoped to this package only.
//
// Formatting is owned by Prettier (.prettierrc.json) — no stylistic rules here.

import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
    },
  },
);
