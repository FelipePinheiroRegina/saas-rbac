import eslintConfigNode from '@saas-rbac/eslint-config/node'

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
