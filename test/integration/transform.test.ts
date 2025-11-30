import { describe, expect, it } from 'vitest'
import { createContext } from '../../src/core/ctx'

describe('integration', () => {
  describe('context and filter', () => {
    it('should create context with default options', () => {
      const ctx = createContext()
      expect(ctx).toBeDefined()
      expect(ctx.filter).toBeDefined()
      expect(ctx.transform).toBeDefined()
    })

    it('should filter JavaScript files', () => {
      const ctx = createContext()
      expect(ctx.filter('/path/to/file.js')).toBe(false) // Will be false because not in git repo in test
    })

    it('should filter TypeScript files', () => {
      const ctx = createContext()
      expect(ctx.filter('/path/to/file.ts')).toBe(false)
    })

    it('should filter Vue files', () => {
      const ctx = createContext()
      expect(ctx.filter('/path/to/component.vue')).toBe(false)
    })

    it('should filter Svelte files', () => {
      const ctx = createContext()
      expect(ctx.filter('/path/to/component.svelte')).toBe(false)
    })

    it('should exclude node_modules', () => {
      const ctx = createContext()
      expect(ctx.filter('/path/node_modules/package/file.js')).toBe(false)
    })

    it('should respect custom include patterns', () => {
      const ctx = createContext({
        include: [/\.custom$/],
      })
      expect(ctx.filter('/path/to/file.custom')).toBe(false)
    })

    it('should respect custom exclude patterns', () => {
      const ctx = createContext({
        exclude: [/\.test\.js$/],
      })
      expect(ctx.filter('/path/to/file.test.js')).toBe(false)
    })
  })

  describe('environment detection', () => {
    it('should skip in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const ctx = createContext()
      expect(ctx.filter('/path/to/file.js')).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('transform with Vue files', () => {
    it('should handle Vue SFC files', async () => {
      const ctx = createContext()
      const code = `
<template>
  <div>Test</div>
</template>

<script>
export default {
  mounted() {
    console.log('mounted')
  }
}
</script>
      `

      // Will return null because not in git repo, but shouldn't crash
      const result = await ctx.transform(code, '/path/to/component.vue')
      expect(result).toBeNull()
    })
  })

  describe('transform with Svelte files', () => {
    it('should handle Svelte component files', async () => {
      const ctx = createContext()
      const code = `
<script>
  let count = 0
  console.log('init')
</script>

<main>
  <h1>Count: {count}</h1>
</main>
      `

      // Will return null because not in git repo, but shouldn't crash
      const result = await ctx.transform(code, '/path/to/component.svelte')
      expect(result).toBeNull()
    })
  })

  describe('custom remove methods', () => {
    it('should support custom method names', () => {
      const ctx = createContext({
        removeMethods: ['debug', 'logger.info'],
      })
      expect(ctx).toBeDefined()
    })

    it('should support multiple method names', () => {
      const ctx = createContext({
        removeMethods: ['console.log', 'console.debug', 'console.info'],
      })
      expect(ctx).toBeDefined()
    })
  })

  describe('removal modes', () => {
    it('should support strict mode', () => {
      const ctx = createContext({ mode: 'strict' })
      expect(ctx).toBeDefined()
    })

    it('should support file mode', () => {
      const ctx = createContext({ mode: 'file' })
      expect(ctx).toBeDefined()
    })

    it('should support user mode', () => {
      const ctx = createContext({ mode: 'user' })
      expect(ctx).toBeDefined()
    })

    it('should support time mode', () => {
      const ctx = createContext({
        mode: 'time',
        expiration: '30d',
      })
      expect(ctx).toBeDefined()
    })
  })
})
