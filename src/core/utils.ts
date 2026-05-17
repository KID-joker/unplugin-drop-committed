import * as process from 'node:process'

export function* getLines(data: string | string[], char: string = '\n'): IterableIterator<string> {
  if (typeof data === 'string') {
    let i = 0
    while (i < data.length) {
      let j = data.indexOf(char, i)
      if (j === -1) {
        j = data.length
      } else {
        j += 1
      }

      yield data.substring(i, j)
      i = j
    }

    return
  }

  let count = 0
  let leftover: string | undefined
  for (let s of data) {
    count++
    if (leftover) {
      s = leftover + s
      leftover = undefined
    }

    let i = 0
    while (i < s.length) {
      let j = s.indexOf(char, i)
      if (j === -1) {
        if (count === data.length) {
          j = s.length
        } else {
          leftover = s.substring(i)
          break
        }
      }

      yield s.substring(i, j)
      i = j + 1
    }
  }
}

export function cleanUrl(url: string): string {
  return url.replace(/[?#].*$/, '')
}

/**
 * Parse expiration string to timestamp
 * Supports: ISO date strings, relative time (e.g., '30d', '1y', '6M')
 */
export function parseExpiration(exp: string): number {
  // Try parsing as ISO date string first
  const isoDate = new Date(exp)
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.getTime()
  }

  // Parse relative time format
  const match = exp.match(/^(\d+)([dMy])$/)
  if (!match) {
    throw new Error(`Invalid expiration format: ${exp}. Use ISO date or relative time (e.g., '30d', '1y', '6M')`)
  }

  const [, amount, unit] = match
  const now = Date.now()
  const value = Number.parseInt(amount, 10)

  switch (unit) {
    case 'd': // days
      return now - value * 24 * 60 * 60 * 1000
    case 'M': // months (approximate as 30 days)
      return now - value * 30 * 24 * 60 * 60 * 1000
    case 'y': // years (approximate as 365 days)
      return now - value * 365 * 24 * 60 * 60 * 1000
    default:
      throw new Error(`Unknown time unit: ${unit}`)
  }
}

/**
 * Detect if running in development environment
 */
export function isDevEnvironment(): boolean {
  // Check NODE_ENV
  return process.env.NODE_ENV !== 'production'
}

/**
 * Match file path against patterns (string or RegExp)
 */
export function matchesPattern(filePath: string, patterns: (string | RegExp)[]): boolean {
  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      // Simple glob-like matching
      const DOUBLESTAR = 'DOUBLESTAR'
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, DOUBLESTAR)
        .replace(/\*/g, '[^/]*')
        .replace(new RegExp(DOUBLESTAR, 'g'), '.*')
        .replace(/\?/g, '.')
      return new RegExp(`^${regexPattern}$`).test(filePath)
    }
    return pattern.test(filePath)
  })
}

/**
 * Parse .gitignore file content into patterns
 */
export function parseGitignore(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
    .map((line) => {
      // Convert gitignore patterns to glob patterns
      if (line.endsWith('/')) {
        return `${line}**`
      }
      if (!line.includes('/')) {
        return `**/${line}`
      }
      return line
    })
}
