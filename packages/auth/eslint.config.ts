import eslintConfigLibrary from '@saas-rbac/eslint-config/library'

const __dirname = new URL('.', import.meta.url).pathname

export default [
  ...eslintConfigLibrary,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
]
