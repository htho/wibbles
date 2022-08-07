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
      'plugin:@typescript-eslint/strict',
      'plugin:jest/recommended',
    ],
    rules: {
      "semi": ["error", "always"],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          "checksVoidReturn": false
        }
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          "allowAny": true
        }
      ],
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-this-alias": "off",
      // note you must disable the base rule as it can report incorrect errors
      "dot-notation": "off",
      "@typescript-eslint/dot-notation": ["error", {
        allowPrivateClassPropertyAccess: true,
        allowProtectedClassPropertyAccess: true,
        allowIndexSignaturePropertyAccess: true,
      }],
      "no-empty-function": "off",
      "@typescript-eslint/no-empty-function": "off",
    }
  };