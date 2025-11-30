export type RemovalMode = 'strict' | 'file' | 'user' | 'time'

export interface Options {
  /**
   * Removal mode
   * - strict: Check each method call's Git blame. Replace if the line is committed.
   * - file: Check file's Git status. Replace if file is not new/modified/deleted.
   * - user: Check method call's Git author. Replace if author doesn't match current user.
   * - time: Check method call's commit timestamp. Replace if committed before expiration.
   * @default 'strict'
   */
  mode?: RemovalMode

  /**
   * Method names to remove (supports dot notation like 'console.log')
   * @default ['console.log']
   */
  removeMethods?: string[]

  /**
   * File inclusion patterns
   * @default [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/]
   */
  include?: (string | RegExp)[]

  /**
   * File exclusion patterns (always includes node_modules and .gitignore files)
   * @default ['node_modules/**']
   */
  exclude?: (string | RegExp)[]

  /**
   * Expiration time for 'time' mode
   * Supports: ISO date strings, relative time (e.g., '30d', '1y', '6M')
   * @example '2024-01-01', '30d', '1y'
   */
  expiration?: string
}

export interface ResolvedOptions {
  mode: RemovalMode
  removeMethods: string[]
  include: (string | RegExp)[]
  exclude: (string | RegExp)[]
  expiration?: string
}

export interface ScriptBlock {
  content: string
  offset: number
  line: number
}

export interface MethodCallLocation {
  start: number
  end: number
  line: number
  column: number
  methodName: string
}
