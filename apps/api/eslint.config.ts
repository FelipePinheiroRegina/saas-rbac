import eslintConfigNode from '@saas-rbac/eslint-config/node'

export default [
  ...eslintConfigNode,
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
