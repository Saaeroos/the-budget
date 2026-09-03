import expoConfig from 'eslint-config-expo/flat.js';

export default [
  ...expoConfig,
  { ignores: ['node_modules/**', '**/node_modules/**', '.expo/**', 'dist/**', 'scripts/**', '**/*.gen.ts'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 3],
      'max-depth': ['error', 3],
      complexity: ['error', 10],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Rule 02: use an `as const` object with a derived union instead of an enum.' },
        { selector: 'TSAnyKeyword', message: 'Rule 02: no `any`. Use `unknown` and narrow with zod.' },
        { selector: 'TSInterfaceDeclaration[id.name=/^I[A-Z]/]', message: 'Rule 02: no `I` prefix on interfaces.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/features/*/*'], message: 'Rule 01: import a feature through its index barrel only.' },
            { group: ['react-native'], importNames: ['Text'], message: 'Rule 06: use `Text` from @/ui.' },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/mobile/src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/features/**', '@/store/**', '@/db/**', '@tanstack/react-query'],
                       message: 'Rule 01: ui/ may not import features, stores, the db or queries.' }] },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    rules: { 'max-lines-per-function': 'off', 'no-restricted-syntax': 'off' },
  },
];
