import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const simTimeBan = (selector, name) => ({
  selector,
  message: `${name} is nondeterministic; derive time or randomness from sim state.`,
});

const simBoundaryPattern = {
  group: [
    'three',
    'three/**',
    'three-mesh-bvh',
    'three-mesh-bvh/**',
    '**/app',
    '**/app/**',
    '**/view',
    '**/view/**',
  ],
  message: 'src/sim must not import renderer or application modules.',
};

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [simBoundaryPattern],
        },
      ],
      'no-restricted-syntax': [
        'error',
        simTimeBan(
          "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          'Date.now()',
        ),
        simTimeBan(
          "CallExpression[callee.object.name='performance'][callee.property.name='now']",
          'performance.now()',
        ),
        simTimeBan(
          "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          'Math.random()',
        ),
        {
          selector: 'ImportExpression',
          message: 'src/sim must use statically enforceable imports.',
        },
      ],
    },
  },
  {
    files: ['src/sim/**/*.ts'],
    ignores: ['src/sim/**/*.test.ts', 'src/sim/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            simBoundaryPattern,
            {
              regex: '^(?!\\.{1,2}/)',
              message: 'src/sim runtime must remain dependency-zero.',
            },
            {
              group: ['../**'],
              message: 'src/sim runtime must not import outside src/sim.',
            },
          ],
        },
      ],
    },
  },
);
