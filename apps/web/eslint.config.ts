import eslintConfigNext from '@saas-rbac/eslint-config/next'

export default [
  ...eslintConfigNext,
  {
    ignores: ['src/generated/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
]
