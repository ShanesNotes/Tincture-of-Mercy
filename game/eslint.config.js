import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const simTimeBan = (selector, name) => ({
  selector,
  message: `${name} is nondeterministic; derive time or randomness from sim state.`,
});

// MemberExpression (not CallExpression) so `const r = Math.random` aliases
// and `globalThis.Math.random()` both fail. object.property.name catches the
// globalThis/window/global prefix; object.name catches the bare binding.
const simTimeBans = [
  simTimeBan(
    "MemberExpression[property.name='now'][object.name='Date']",
    'Date.now',
  ),
  simTimeBan(
    "MemberExpression[property.name='now'][object.property.name='Date']",
    'Date.now via globalThis/window',
  ),
  simTimeBan(
    "MemberExpression[property.name='now'][object.name='performance']",
    'performance.now',
  ),
  simTimeBan(
    "MemberExpression[property.name='now'][object.property.name='performance']",
    'performance.now via globalThis/window',
  ),
  simTimeBan(
    "MemberExpression[property.name='random'][object.name='Math']",
    'Math.random',
  ),
  simTimeBan(
    "MemberExpression[property.name='random'][object.property.name='Math']",
    'Math.random via globalThis/window',
  ),
  simTimeBan(
    "CallExpression[callee.property.name='getTime'][callee.object.type='NewExpression'][callee.object.callee.name='Date']",
    'new Date().getTime()',
  ),
  simTimeBan(
    "CallExpression[callee.property.name='valueOf'][callee.object.type='NewExpression'][callee.object.callee.name='Date']",
    'new Date().valueOf()',
  ),
];

const simRequireBan = {
  selector: "CallExpression[callee.name='require']",
  message: 'src/sim must use statically enforceable imports (no CommonJS require).',
};

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
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
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
    files: ['src/sim/**/*.{ts,js,mjs,cjs}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [simBoundaryPattern],
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...simTimeBans,
        simRequireBan,
        {
          selector: 'ImportExpression',
          message: 'src/sim must use statically enforceable imports.',
        },
      ],
    },
  },
  {
    files: ['src/sim/**/*.{ts,js,mjs,cjs}'],
    ignores: [
      'src/sim/**/*.test.ts',
      'src/sim/**/*.spec.ts',
      'src/sim/**/*.test.js',
      'src/sim/**/*.spec.js',
      // sim/world is the deliberate composition boundary between sibling
      // simulation modules. Its narrower rule below still rejects packages
      // and paths that escape src/sim.
      'src/sim/world/**/*.ts',
      'src/sim/world/**/*.js',
    ],
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
  {
    files: ['src/sim/world/**/*.ts'],
    ignores: ['src/sim/world/**/*.test.ts', 'src/sim/world/**/*.spec.ts'],
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
              group: ['../../**'],
              message: 'src/sim/world runtime must not import outside src/sim.',
            },
          ],
        },
      ],
    },
  },
);
