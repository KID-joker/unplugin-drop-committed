import { describe, expect, it, vi } from 'vitest'
import { transform } from '../../src/core/transform'
import type { ResolvedOptions } from '../../src/types'
import { Status, uncommitted } from '../../src/core/git'

describe('removal modes', () => {
  const mockGit = {
    getBlame: vi.fn(),
    getStatus: vi.fn(),
    getCurrentUser: vi.fn(),
    getCommitTime: vi.fn(),
    checkIsRepo: vi.fn(),
    checkIsIgnore: vi.fn(),
    getCurrentConfig: vi.fn(),
    loadGitignorePatterns: vi.fn(),
    invalidateCache: vi.fn(),
  }

  const baseOptions: ResolvedOptions = {
    mode: 'strict',
    removeMethods: ['console.log'],
    include: [/\.js$/],
    exclude: [],
  }

  describe('strict mode', () => {
    it('should remove committed lines', async () => {
      const code = `
function test() {
  console.log('hello')
}
      `

      mockGit.getBlame.mockResolvedValue({
        sha: 'abc123',
        line: 3,
        author: 'Test User',
        authorEmail: 'test@example.com',
      })

      const result = await transform(code, 'test.js', baseOptions, mockGit as any)
      expect(result).not.toBeNull()
      expect(result!.code).toContain('(() => {})')
      expect(result!.code).not.toContain('console.log')
    })

    it('should not remove uncommitted lines', async () => {
      const code = `
function test() {
  console.log('hello')
}
      `

      mockGit.getBlame.mockResolvedValue({
        sha: uncommitted,
        line: 3,
        author: 'You',
      })

      const result = await transform(code, 'test.js', baseOptions, mockGit as any)
      expect(result).toBeNull()
    })
  })

  describe('file mode', () => {
    it('should remove all calls if file is committed', async () => {
      const code = `
console.log('first')
console.log('second')
      `

      const options: ResolvedOptions = { ...baseOptions, mode: 'file' }
      mockGit.getStatus.mockResolvedValue(undefined) // No status = committed

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).not.toBeNull()
      expect(result!.code).toContain('(() => {})')
      expect((result!.code.match(/\(\(\) => \{\}\)/g) || []).length).toBe(2)
    })

    it('should not remove calls if file is modified', async () => {
      const code = `
console.log('first')
console.log('second')
      `

      const options: ResolvedOptions = { ...baseOptions, mode: 'file' }
      mockGit.getStatus.mockResolvedValue(Status.MODIFIED)

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).toBeNull()
    })

    it('should not remove calls if file is untracked', async () => {
      const code = `console.log('test')`

      const options: ResolvedOptions = { ...baseOptions, mode: 'file' }
      mockGit.getStatus.mockResolvedValue(Status.UNTRACKED)

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).toBeNull()
    })
  })

  describe('user mode', () => {
    it('should remove calls from other users', async () => {
      const code = `console.log('test')`

      const options: ResolvedOptions = { ...baseOptions, mode: 'user' }

      mockGit.getCurrentUser.mockResolvedValue({
        name: 'Current User',
        email: 'current@example.com',
      })

      mockGit.getBlame.mockResolvedValue({
        sha: 'abc123',
        line: 1,
        author: 'Other User',
        authorEmail: 'other@example.com',
      })

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).not.toBeNull()
      expect(result!.code).toContain('(() => {})')
    })

    it('should not remove calls from current user', async () => {
      const code = `console.log('test')`

      const options: ResolvedOptions = { ...baseOptions, mode: 'user' }

      mockGit.getCurrentUser.mockResolvedValue({
        name: 'Current User',
        email: 'current@example.com',
      })

      mockGit.getBlame.mockResolvedValue({
        sha: 'abc123',
        line: 1,
        author: 'Current User',
        authorEmail: 'current@example.com',
      })

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).toBeNull()
    })
  })

  describe('time mode', () => {
    it('should remove calls older than expiration', async () => {
      const code = `console.log('test')`

      const options: ResolvedOptions = {
        ...baseOptions,
        mode: 'time',
        expiration: '30d',
      }

      const oldTimestamp = Date.now() - 60 * 24 * 60 * 60 * 1000 // 60 days ago

      mockGit.getBlame.mockResolvedValue({
        sha: 'abc123',
        line: 1,
        author: 'Test User',
      })

      mockGit.getCommitTime.mockResolvedValue(oldTimestamp)

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).not.toBeNull()
      expect(result!.code).toContain('(() => {})')
    })

    it('should not remove recent calls', async () => {
      const code = `console.log('test')`

      const options: ResolvedOptions = {
        ...baseOptions,
        mode: 'time',
        expiration: '30d',
      }

      const recentTimestamp = Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago

      mockGit.getBlame.mockResolvedValue({
        sha: 'abc123',
        line: 1,
        author: 'Test User',
      })

      mockGit.getCommitTime.mockResolvedValue(recentTimestamp)

      const result = await transform(code, 'test.js', options, mockGit as any)
      expect(result).toBeNull()
    })
  })
})
