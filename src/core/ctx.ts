import type { Options, ResolvedOptions } from '../types'
import { createGit } from './git'
import { transform as transformCode } from './transform'
import { cleanUrl, isDevEnvironment, matchesPattern } from './utils'

/**
 * Create plugin context
 */
export function createContext(options: Options = {}) {
  // Check if running in dev environment
  const isDev = isDevEnvironment()

  if (!isDev) {
    // Return minimal context that does nothing
    return {
      filter: () => false,
      transform: async () => null,
    }
  }

  // Resolve options with defaults
  const resolved: ResolvedOptions = {
    mode: options.mode ?? 'strict',
    removeMethods: options.removeMethods ?? ['console.log'],
    include: options.include ?? [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/],
    exclude: options.exclude ?? [],
    expiration: options.expiration,
  }

  // Initialize Git operations
  const git = createGit()

  // Load gitignore patterns
  let gitignorePatterns: string[] = []
  git.loadGitignorePatterns().then((patterns) => {
    gitignorePatterns = patterns
  })

  // Check if in a git repository
  let isGitRepo = false
  git.checkIsRepo().then((result) => {
    isGitRepo = result
    if (!isGitRepo) {
      console.warn('[unplugin-drop-committed] Not in a Git repository. Plugin will be disabled.')
    }
  }).catch(() => {
    console.warn('[unplugin-drop-committed] Failed to check Git repository status.')
  })

  /**
   * Filter function to determine if file should be transformed
   */
  function filter(id: string): boolean {
    if (!isGitRepo) {
      return false
    }

    const cleanId = cleanUrl(id)

    // Always exclude node_modules
    if (cleanId.includes('node_modules')) {
      return false
    }

    // Check against gitignore patterns
    if (gitignorePatterns.length > 0 && matchesPattern(cleanId, gitignorePatterns)) {
      return false
    }

    // Check exclude patterns
    if (resolved.exclude.length > 0 && matchesPattern(cleanId, resolved.exclude)) {
      return false
    }

    // Check include patterns
    if (resolved.include.length > 0) {
      return matchesPattern(cleanId, resolved.include)
    }

    return true
  }

  /**
   * Transform function
   */
  async function transform(code: string, id: string) {
    if (!isGitRepo) {
      return null
    }

    const cleanId = cleanUrl(id)
    return await transformCode(code, cleanId, resolved, git)
  }

  return {
    filter,
    transform,
  }
}
