// Flat ESLint config (ESLint v9+). Import-free base so it is valid the moment `eslint`
// is installed, without requiring other plugins. As packages add TypeScript, extend this
// with `typescript-eslint` (https://typescript-eslint.io) in the package or here.
//
// Formatting is owned by Prettier (.prettierrc.json) — keep stylistic rules out of ESLint.

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
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
];
