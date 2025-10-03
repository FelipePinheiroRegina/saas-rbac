import eslintConfigNode from '@saas-rbac/eslint-config/node'

const __dirname = new URL('.', import.meta.url).pathname

export default [
  ...eslintConfigNode,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
]
