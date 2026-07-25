// ESLint 9 flat config. 자체 완결형(@eslint/js 의존 없이 동작).
const nodeGlobals = {
  process: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'writable',
  require: 'readonly',
  exports: 'writable',
  console: 'readonly',
  global: 'writable',
  Buffer: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
  setInterval: 'readonly',
  clearTimeout: 'readonly',
  clearInterval: 'readonly'
};

const jestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  jest: 'readonly'
};

module.exports = [
  {
    ignores: ['node_modules/**', 'logs/**']
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: nodeGlobals
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$' }],
      'no-undef': 'error',
      'no-console': 'warn',
      eqeqeq: ['warn', 'smart']
    }
  },
  {
    files: ['src/**/__tests__/**/*.js', 'src/**/*.test.js'],
    languageOptions: {
      globals: { ...nodeGlobals, ...jestGlobals }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
