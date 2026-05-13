import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import boundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.app.json" },
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "widgets", pattern: "src/widgets/**" },
        { type: "modules", pattern: "src/modules/*", mode: "folder" },
        { type: "shared", pattern: "src/shared/**" },
        { type: "mocks", pattern: "src/mocks/**" },
        { type: "test", pattern: "src/test/**" },
      ],
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
      boundaries,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message:
            "Use `as const` object + literal union instead of TS enum. See CLAUDE.md → Code style → Domain string constants.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 80, skipBlankLines: true, skipComments: true }],
      "id-length": ["error", { min: 2, exceptions: ["_"] }],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variableLike",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      "import/no-default-export": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          pathGroups: [
            { pattern: "@/**", group: "internal", position: "after" },
          ],
        },
      ],
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["widgets", "modules", "shared"] },
            { from: "widgets", allow: ["app", "modules", "shared"] },
            { from: "modules", allow: ["app", "shared"] },
            { from: "shared", allow: ["shared"] },
            { from: "mocks", allow: ["shared", "modules"] },
            { from: "test", allow: ["app", "widgets", "modules", "shared", "mocks"] },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/**/pages/**/*.{ts,tsx}",
      "**/*.config.{ts,js,mjs}",
      "vite.config.ts",
      "vitest.config.ts",
      "eslint.config.js",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
);
