import { describe, expect, it } from 'vitest'
import { Status, parseBlame, parseStatus, uncommitted } from '../src/core/git'

describe('parseStatus', () => {
  it('should parse untracked status', () => {
    expect(parseStatus({ x: '?', y: '?' })).toBe(Status.UNTRACKED)
  })

  it('should parse ignored status', () => {
    expect(parseStatus({ x: '!', y: '!' })).toBe(Status.IGNORED)
  })

  it('should parse both deleted status', () => {
    expect(parseStatus({ x: 'D', y: 'D' })).toBe(Status.BOTH_DELETED)
  })

  it('should parse added by us status', () => {
    expect(parseStatus({ x: 'A', y: 'U' })).toBe(Status.ADDED_BY_US)
  })

  it('should parse deleted by them status', () => {
    expect(parseStatus({ x: 'U', y: 'D' })).toBe(Status.DELETED_BY_THEM)
  })

  it('should parse added by them status', () => {
    expect(parseStatus({ x: 'U', y: 'A' })).toBe(Status.ADDED_BY_THEM)
  })

  it('should parse deleted by us status', () => {
    expect(parseStatus({ x: 'D', y: 'U' })).toBe(Status.DELETED_BY_US)
  })

  it('should parse both added status', () => {
    expect(parseStatus({ x: 'A', y: 'A' })).toBe(Status.BOTH_ADDED)
  })

  it('should parse both modified status', () => {
    expect(parseStatus({ x: 'U', y: 'U' })).toBe(Status.BOTH_MODIFIED)
  })

  it('should parse index modified status', () => {
    expect(parseStatus({ x: 'M', y: ' ' })).toBe(Status.INDEX_MODIFIED)
  })

  it('should parse index added status', () => {
    expect(parseStatus({ x: 'A', y: ' ' })).toBe(Status.INDEX_ADDED)
  })

  it('should parse index deleted status', () => {
    expect(parseStatus({ x: 'D', y: ' ' })).toBe(Status.INDEX_DELETED)
  })

  it('should parse index renamed status', () => {
    expect(parseStatus({ x: 'R', y: ' ' })).toBe(Status.INDEX_RENAMED)
  })

  it('should parse index copied status', () => {
    expect(parseStatus({ x: 'C', y: ' ' })).toBe(Status.INDEX_COPIED)
  })

  it('should parse working tree modified status', () => {
    expect(parseStatus({ x: ' ', y: 'M' })).toBe(Status.MODIFIED)
  })

  it('should parse working tree deleted status', () => {
    expect(parseStatus({ x: ' ', y: 'D' })).toBe(Status.DELETED)
  })

  it('should parse intent to add status', () => {
    expect(parseStatus({ x: ' ', y: 'A' })).toBe(Status.INTENT_TO_ADD)
  })

  it('should parse intent to rename status', () => {
    expect(parseStatus({ x: ' ', y: 'R' })).toBe(Status.INTENT_TO_RENAME)
  })

  it('should parse type changed status', () => {
    expect(parseStatus({ x: ' ', y: 'T' })).toBe(Status.TYPE_CHANGED)
  })

  it('should return undefined for unknown status', () => {
    expect(parseStatus({ x: ' ', y: ' ' })).toBeUndefined()
  })
})

describe('parseBlame', () => {
  it('should parse normal blame output', () => {
    const data = `abc1234 1 1 1
author John Doe
author-mail <john@example.com>
author-time 1700000000
summary some commit
filename src/index.ts
\tconsole.log('hello')
`
    const entry = parseBlame(data)
    expect(entry).toBeDefined()
    expect(entry!.sha).toBe('abc1234')
    expect(entry!.author).toBe('John Doe')
    expect(entry!.authorEmail).toBe('john@example.com')
  })

  it('should handle uncommitted changes', () => {
    const data = `${uncommitted} 1 1 1
author You
author-mail <not.committed.yet>
`
    const entry = parseBlame(data)
    expect(entry).toBeDefined()
    expect(entry!.sha).toBe(uncommitted)
    expect(entry!.author).toBe('You')
    expect(entry!.authorEmail).toBeUndefined()
  })

  it('should return undefined for empty data', () => {
    expect(parseBlame('')).toBeUndefined()
  })

  it('should handle author-mail without angle brackets', () => {
    const data = `abc1234 1 1 1
author Jane
author-mail jane@example.com
`
    const entry = parseBlame(data)
    expect(entry).toBeDefined()
    expect(entry!.authorEmail).toBe('jane@example.com')
  })

  it('should handle author-mail with angle brackets', () => {
    const data = `def5678 1 1 1
author Bob
author-mail <bob@test.org>
`
    const entry = parseBlame(data)
    expect(entry).toBeDefined()
    expect(entry!.authorEmail).toBe('bob@test.org')
  })
})
