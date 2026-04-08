import nextPlugin from '@next/eslint-plugin-next'
import baseConfig from '../../packages/config/eslint/base.mjs'

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: {
      '@next/next': nextPlugin
    },
    settings: {
      next: {
        rootDir: '.'
      }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules
    }
  }
]
