import { describe, expect, it } from 'vitest'
import {
  cleanUrl,
  getLines,
  isDevEnvironment,
  matchesPattern,
  parseExpiration,
  parseGitignore,
} from '../src/core/utils'

describe('getLines', () => {
  it('should split string by newline', () => {
    const result = [...getLines('line1\nline2\nline3')]
    expect(result).toEqual(['line1\n', 'line2\n', 'line3'])
  })

  it('should handle empty string', () => {
    const result = [...getLines('')]
    expect(result).toEqual([])
  })

  it('should handle string without newline', () => {
    const result = [...getLines('single line')]
    expect(result).toEqual(['single line'])
  })

  it('should handle custom separator', () => {
    const result = [...getLines('a|b|c', '|')]
    expect(result).toEqual(['a|', 'b|', 'c'])
  })

  it('should handle string array input', () => {
    const result = [...getLines(['line1\nline2', '\nline3'])]
    expect(result).toEqual(['line1', 'line2', 'line3'])
  })

  it('should handle string array with leftover', () => {
    const result = [...getLines(['ab', 'c\nd'])]
    expect(result).toEqual(['abc', 'd'])
  })
})

describe('cleanUrl', () => {
  it('should remove query string', () => {
    expect(cleanUrl('/path/file.ts?vue&type=script')).toBe('/path/file.ts')
  })

  it('should remove hash', () => {
    expect(cleanUrl('/path/file.ts#section')).toBe('/path/file.ts')
  })

  it('should remove both query and hash', () => {
    expect(cleanUrl('/path/file.ts?query=1#hash')).toBe('/path/file.ts')
  })

  it('should not modify url without query or hash', () => {
    expect(cleanUrl('/path/file.ts')).toBe('/path/file.ts')
  })
})

describe('parseExpiration', () => {
  it('should parse ISO date string', () => {
    const result = parseExpiration('2024-01-01')
    expect(result).toBe(new Date('2024-01-01').getTime())
  })

  it('should parse relative days', () => {
    const before = Date.now()
    const result = parseExpiration('30d')
    const after = Date.now()
    const expected = 30 * 24 * 60 * 60 * 1000
    // Result should be approximately now - 30 days
    expect(result).toBeGreaterThanOrEqual(before - expected)
    expect(result).toBeLessThanOrEqual(after - expected)
  })

  it('should parse relative months', () => {
    const before = Date.now()
    const result = parseExpiration('6M')
    const after = Date.now()
    const expected = 6 * 30 * 24 * 60 * 60 * 1000
    expect(result).toBeGreaterThanOrEqual(before - expected)
    expect(result).toBeLessThanOrEqual(after - expected)
  })

  it('should parse relative years', () => {
    const before = Date.now()
    const result = parseExpiration('1y')
    const after = Date.now()
    const expected = 365 * 24 * 60 * 60 * 1000
    expect(result).toBeGreaterThanOrEqual(before - expected)
    expect(result).toBeLessThanOrEqual(after - expected)
  })

  it('should throw on invalid format', () => {
    expect(() => parseExpiration('invalid')).toThrow('Invalid expiration format')
  })

  it('should throw on unknown unit', () => {
    expect(() => parseExpiration('30x')).toThrow('Invalid expiration format')
  })
})

describe('isDevEnvironment', () => {
  const originalEnv = process.env.NODE_ENV

  it('should return true when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development'
    expect(isDevEnvironment()).toBe(true)
  })

  it('should return true when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(isDevEnvironment()).toBe(true)
  })

  it('should return false when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    expect(isDevEnvironment()).toBe(false)
  })

  // Restore original env
  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })
})

describe('matchesPattern', () => {
  it('should match deep path with **/*', () => {
    expect(matchesPattern('src/core/utils.ts', ['**/*.ts'])).toBe(true)
  })

  it('should match node_modules with **', () => {
    expect(matchesPattern('node_modules/pkg/index.js', ['node_modules/**'])).toBe(true)
  })

  it('should not match deep path when pattern does not apply', () => {
    expect(matchesPattern('src/core/utils.js', ['**/*.ts'])).toBe(false)
  })

  it('should match glob pattern with *', () => {
    expect(matchesPattern('utils.ts', ['*.ts'])).toBe(true)
  })

  it('should match glob pattern with ?', () => {
    expect(matchesPattern('a.ts', ['?.ts'])).toBe(true)
  })

  it('should not match when pattern does not apply', () => {
    expect(matchesPattern('utils.js', ['*.ts'])).toBe(false)
  })

  it('should match RegExp pattern', () => {
    expect(matchesPattern('src/file.tsx', [/\.tsx?$/])).toBe(true)
  })

  it('should return false for empty patterns', () => {
    expect(matchesPattern('file.ts', [])).toBe(false)
  })

  it('should match node_modules pattern with RegExp', () => {
    expect(matchesPattern('node_modules/pkg/index.js', [/^node_modules\//])).toBe(true)
  })
})

describe('parseGitignore', () => {
  it('should filter comments and empty lines', () => {
    const content = `# comment
node_modules

dist
# another comment
`
    const result = parseGitignore(content)
    expect(result).toEqual(['**/node_modules', '**/dist'])
  })

  it('should convert directory patterns (ending with /)', () => {
    const content = `build/
.cache/`
    const result = parseGitignore(content)
    expect(result).toEqual(['build/**', '.cache/**'])
  })

  it('should add **/ prefix for patterns without /', () => {
    const content = `*.log
.env`
    const result = parseGitignore(content)
    expect(result).toEqual(['**/*.log', '**/.env'])
  })

  it('should keep patterns with / as-is', () => {
    const content = `src/generated/output.js`
    const result = parseGitignore(content)
    expect(result).toEqual(['src/generated/output.js'])
  })

  it('should handle empty content', () => {
    expect(parseGitignore('')).toEqual([])
  })
})
