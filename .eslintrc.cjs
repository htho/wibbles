// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      // eslint-disable-next-line no-undef
      tsconfigRootDir: __dirname,
      project: ['./tsconfig.json', './tsconfig.eslint.json'],
    },
    plugins: [
      '@typescript-eslint',
      'jest',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:jest/recommended',
    ],

  };