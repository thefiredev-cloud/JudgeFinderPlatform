// ESLint v9 flat config bridging from existing .eslintrc.json
// Keeps Next.js and Prettier rules while allowing ESLint 9 to run.
const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  // Global ignores to prevent linting build artifacts
  {
    ignores: ['**/.next/**', '**/.netlify/**', 'node_modules/**', 'dist/**', 'out/**', 'coverage/**']
  },
  // Bring in Next.js defaults and Prettier compatibility
  ...compat.extends('next/core-web-vitals', 'eslint-config-prettier'),
  // Repo-wide settings
  {
    rules: {
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];
