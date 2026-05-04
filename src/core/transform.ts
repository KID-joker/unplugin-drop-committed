import MagicString from 'magic-string'
import type { ResolvedOptions } from '../types'
import type { createGit } from './git'
import { Status, uncommitted } from './git'
import { findMethodCalls } from './parser'
import { extractScriptBlocks } from './scriptExtractor'
import { parseExpiration } from './utils'

type Git = ReturnType<typeof createGit>

/**
 * Main transform function
 */
export async function transform(
  code: string,
  id: string,
  options: ResolvedOptions,
  git: Git,
): Promise<{ code: string, map: any } | null> {
  try {
    // Extract script content for Vue/Svelte files
    let scriptBlocks: Array<{ content: string, offset: number, line: number }> = []

    if (id.endsWith('.vue') || id.includes('.vue?') || id.endsWith('.svelte')) {
      scriptBlocks = extractScriptBlocks(code)
      if (scriptBlocks.length === 0) {
        return null
      }
    }
    else {
      // For regular JS/TS files, treat entire file as one script block
      scriptBlocks = [{ content: code, offset: 0, line: 1 }]
    }

    // Collect all method calls from all script blocks
    const allCallsToRemove = []

    for (const scriptBlock of scriptBlocks) {
      const lineOffset = scriptBlock.line - 1
      const scriptOffset = scriptBlock.offset

      // Find all method calls in this script block
      const methodCalls = findMethodCalls(scriptBlock.content, options.removeMethods, lineOffset)

      if (methodCalls.length === 0) {
        continue
      }

      // Check removal conditions based on mode
      const callsToRemove = await filterCallsToRemove(methodCalls, id, options, git)

      // Adjust positions for Vue/Svelte script offset
      for (const call of callsToRemove) {
        allCallsToRemove.push({
          ...call,
          start: call.start + scriptOffset,
          end: call.end + scriptOffset,
        })
      }
    }

    if (allCallsToRemove.length === 0) {
      return null
    }

    // Replace matched calls with (() => {})
    const s = new MagicString(code)

    for (const call of allCallsToRemove) {
      s.overwrite(call.start, call.end, ';(() => {})')
    }

    return {
      code: s.toString(),
      map: s.generateMap({ hires: true }),
    }
  }
  catch (error) {
    console.warn(`Failed to transform ${id}:`, error)
    return null
  }
}

/**
 * Filter method calls based on removal mode
 */
async function filterCallsToRemove(
  methodCalls: any[],
  filePath: string,
  options: ResolvedOptions,
  git: Git,
): Promise<any[]> {
  const { mode } = options

  switch (mode) {
    case 'strict':
      return await filterStrictMode(methodCalls, filePath, git)
    case 'file':
      return await filterFileMode(methodCalls, filePath, git)
    case 'user':
      return await filterUserMode(methodCalls, filePath, git)
    case 'time':
      return await filterTimeMode(methodCalls, filePath, options, git)
    default:
      return []
  }
}

/**
 * Strict mode: Replace if line is committed
 */
async function filterStrictMode(
  methodCalls: any[],
  filePath: string,
  git: Git,
): Promise<any[]> {
  const result = []

  for (const call of methodCalls) {
    try {
      const blame = await git.getBlame(filePath, call.line)

      // Replace if committed (SHA is not uncommitted)
      if (blame && blame.sha !== uncommitted) {
        result.push(call)
      }
    }
    catch {
      // If blame fails, skip this call
    }
  }

  return result
}

/**
 * File mode: Replace if file is not new/modified/deleted
 */
async function filterFileMode(
  methodCalls: any[],
  filePath: string,
  git: Git,
): Promise<any[]> {
  try {
    const status = await git.getStatus(filePath)

    // Replace all calls if file is not in these states
    const isModified = status === Status.MODIFIED
      || status === Status.INDEX_MODIFIED
      || status === Status.UNTRACKED
      || status === Status.INDEX_ADDED
      || status === Status.INDEX_DELETED
      || status === Status.DELETED

    if (!isModified) {
      return methodCalls
    }
  }
  catch {
    // If status check fails, don't remove anything
  }

  return []
}

/**
 * User mode: Replace if author doesn't match current user
 */
async function filterUserMode(
  methodCalls: any[],
  filePath: string,
  git: Git,
): Promise<any[]> {
  try {
    const currentUser = await git.getCurrentUser()
    const result = []

    for (const call of methodCalls) {
      try {
        const blame = await git.getBlame(filePath, call.line)

        // Replace if author name OR email doesn't match
        if (blame && blame.sha !== uncommitted) {
          const nameMatches = blame.author === currentUser.name
          const emailMatches = blame.authorEmail === currentUser.email

          if (!nameMatches || !emailMatches) {
            result.push(call)
          }
        }
      }
      catch {
        // If blame fails, skip this call
      }
    }

    return result
  }
  catch {
    // If user info fails, don't remove anything
    return []
  }
}

/**
 * Time mode: Replace if committed before expiration time
 */
async function filterTimeMode(
  methodCalls: any[],
  filePath: string,
  options: ResolvedOptions,
  git: Git,
): Promise<any[]> {
  if (!options.expiration) {
    console.warn('Time mode requires expiration option')
    return []
  }

  try {
    const expirationTime = parseExpiration(options.expiration)
    const result = []

    for (const call of methodCalls) {
      try {
        const blame = await git.getBlame(filePath, call.line)

        if (blame && blame.sha !== uncommitted) {
          const commitTime = await git.getCommitTime(blame.sha)

          // Replace if commit time is before expiration
          if (commitTime < expirationTime) {
            result.push(call)
          }
        }
      }
      catch {
        // If blame or commit time fails, skip this call
      }
    }

    return result
  }
  catch (error) {
    console.warn('Failed to parse expiration time:', error)
    return []
  }
}
