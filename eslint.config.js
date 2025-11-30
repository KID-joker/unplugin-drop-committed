// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    rules: {
      'style/brace-style': 'off',
    },
  },
  {
    files: ['test/fixtures/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
)
