import { describe, expect, it } from 'vitest'
import { isDevEnvironment, matchesPattern, parseExpiration, parseGitignore } from '../../src/core/utils'

describe('utils', () => {
  describe('parseExpiration', () => {
    it('should parse ISO date strings', () => {
      const timestamp = parseExpiration('2024-01-01')
      expect(timestamp).toBeGreaterThan(0)
      expect(new Date(timestamp).getFullYear()).toBe(2024)
    })

    it('should parse relative days', () => {
      const now = Date.now()
      const timestamp = parseExpiration('30d')
      const diff = now - timestamp
      const days = diff / (24 * 60 * 60 * 1000)
      expect(days).toBeCloseTo(30, 0)
    })

    it('should parse relative months', () => {
      const now = Date.now()
      const timestamp = parseExpiration('6M')
      const diff = now - timestamp
      const days = diff / (24 * 60 * 60 * 1000)
      expect(days).toBeCloseTo(180, 1) // 6 * 30 days
    })

    it('should parse relative years', () => {
      const now = Date.now()
      const timestamp = parseExpiration('1y')
      const diff = now - timestamp
      const days = diff / (24 * 60 * 60 * 1000)
      expect(days).toBeCloseTo(365, 1)
    })

    it('should throw error for invalid format', () => {
      expect(() => parseExpiration('invalid')).toThrow()
      expect(() => parseExpiration('30x')).toThrow()
    })
  })

  describe('isDevEnvironment', () => {
    it('should return false for production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      expect(isDevEnvironment()).toBe(false)
      process.env.NODE_ENV = originalEnv
    })

    it('should return true for development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      expect(isDevEnvironment()).toBe(true)
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('matchesPattern', () => {
    it('should match exact strings', () => {
      expect(matchesPattern('test.js', ['test.js'])).toBe(true)
      expect(matchesPattern('other.js', ['test.js'])).toBe(false)
    })

    it('should match glob patterns', () => {
      expect(matchesPattern('test.js', ['*.js'])).toBe(true)
      expect(matchesPattern('src/test.js', ['src/*.js'])).toBe(true)
      expect(matchesPattern('src/nested/test.js', ['src/**/*.js'])).toBe(true)
    })

    it('should match RegExp patterns', () => {
      expect(matchesPattern('test.js', [/\.js$/])).toBe(true)
      expect(matchesPattern('test.ts', [/\.js$/])).toBe(false)
      expect(matchesPattern('src/test.vue', [/\.vue$/])).toBe(true)
    })

    it('should match any pattern in array', () => {
      expect(matchesPattern('test.js', [/\.ts$/, /\.js$/])).toBe(true)
      expect(matchesPattern('test.ts', [/\.ts$/, /\.js$/])).toBe(true)
      expect(matchesPattern('test.css', [/\.ts$/, /\.js$/])).toBe(false)
    })
  })

  describe('parseGitignore', () => {
    it('should parse simple patterns', () => {
      const content = `
node_modules
dist
*.log
      `
      const patterns = parseGitignore(content)
      expect(patterns).toContain('**/node_modules')
      expect(patterns).toContain('**/dist')
      expect(patterns).toContain('**/*.log')
    })

    it('should ignore comments and empty lines', () => {
      const content = `
# Comment
node_modules

# Another comment
dist
      `
      const patterns = parseGitignore(content)
      expect(patterns).toHaveLength(2)
      expect(patterns).not.toContain('# Comment')
    })

    it('should handle directory patterns', () => {
      const content = `
build/
.cache/
      `
      const patterns = parseGitignore(content)
      expect(patterns).toContain('build/**')
      expect(patterns).toContain('.cache/**')
    })

    it('should handle path patterns', () => {
      const content = `
src/temp
docs/draft.md
      `
      const patterns = parseGitignore(content)
      expect(patterns).toContain('src/temp')
      expect(patterns).toContain('docs/draft.md')
    })
  })
})
