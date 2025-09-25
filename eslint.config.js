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
  // Repo-wide settings (mostly warnings to guide gradual hardening)
  {
    rules: {
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      // File length guidance repo-wide
      'max-lines': ['warn', { max: 700, skipBlankLines: true, skipComments: true }],
      // Function complexity/size guidance repo-wide
      'max-lines-per-function': ['warn', { max: 60, skipComments: true, IIFEs: true }],
      complexity: ['warn', { max: 12 }],
      'max-depth': ['warn', 3],
      // Prefer single class per file
      'max-classes-per-file': ['warn', 1],
      // Naming & readability: allow snake_case in API/DB properties
      'id-length': ['warn', { min: 2, properties: 'never', exceptions: ['id','fs','ms','rl','qm','x','y','i','j','k','v','p','r','e','t','u','q','d'] }],
      camelcase: ['warn', { properties: 'never', ignoreDestructuring: false }],
      // Encourage modular design by flagging large files with many imports
      'import/max-dependencies': ['warn', { max: 25 }],
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module'
      }
    }
  },
  // TypeScript-specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: false
      }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/naming-convention': [
        'warn',
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] }
      ]
    }
  },
  // STRICT override for core model/manager code paths
  {
    files: [
      'lib/sync/**/*.ts',
      'lib/courtlistener/**/*.ts',
      'lib/courts/**/*.ts',
      'lib/analytics/**/*.ts',
      'lib/security/**/*.ts',
      'lib/ads/**/*.ts',
      'lib/supabase/**/*.ts',
      'lib/cache/**/*.ts',
      'lib/utils/logger.ts'
    ],
    rules: {
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipComments: true, IIFEs: true }],
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 3],
      'max-classes-per-file': ['error', 1],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] }
      ],
      // Keep camelCase for identifiers but allow snake_case properties (DB/API)
      camelcase: ['error', { properties: 'never', ignoreDestructuring: false }],
      'id-length': ['warn', { min: 2, properties: 'never', exceptions: ['id','fs','ms','rl','qm','x','y','i','j','k','v','p','r','e','t','u','q','d'] }],
    }
  }
];
