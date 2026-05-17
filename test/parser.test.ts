import { describe, expect, it } from 'vitest'
import { findMethodCalls } from '../src/core/parser'

describe('findMethodCalls', () => {
  it('should find console.log calls', () => {
    const code = `const x = 1
console.log('hello')
const y = 2`
    const results = findMethodCalls(code, ['console.log'])
    expect(results).toHaveLength(1)
    expect(results[0].methodName).toBe('console.log')
    expect(results[0].line).toBe(2)
  })

  it('should find multiple method calls', () => {
    const code = `console.log('a')
console.warn('b')
console.error('c')`
    const results = findMethodCalls(code, ['console.log', 'console.warn', 'console.error'])
    expect(results).toHaveLength(3)
    expect(results[0].methodName).toBe('console.log')
    expect(results[1].methodName).toBe('console.warn')
    expect(results[2].methodName).toBe('console.error')
  })

  it('should handle nested member expressions', () => {
    const code = `obj.method.call('test')`
    const results = findMethodCalls(code, ['obj.method.call'])
    expect(results).toHaveLength(1)
    expect(results[0].methodName).toBe('obj.method.call')
  })

  it('should find simple identifier calls', () => {
    const code = `log('hello')`
    const results = findMethodCalls(code, ['log'])
    expect(results).toHaveLength(1)
    expect(results[0].methodName).toBe('log')
    expect(results[0].line).toBe(1)
  })

  it('should apply lineOffset correctly', () => {
    const code = `console.log('test')`
    const results = findMethodCalls(code, ['console.log'], 10)
    expect(results).toHaveLength(1)
    expect(results[0].line).toBe(11) // 1 + 10 offset
  })

  it('should not return unmatched methods', () => {
    const code = `console.log('hello')
console.info('world')`
    const results = findMethodCalls(code, ['console.warn'])
    expect(results).toHaveLength(0)
  })

  it('should handle empty code', () => {
    const results = findMethodCalls('', ['console.log'])
    expect(results).toHaveLength(0)
  })

  it('should handle code with syntax errors gracefully', () => {
    const code = `const x = {
  console.log('incomplete`
    const results = findMethodCalls(code, ['console.log'])
    // Should not throw, may or may not find calls depending on error recovery
    expect(Array.isArray(results)).toBe(true)
  })

  it('should handle TypeScript code', () => {
    const code = `
function greet(name: string): void {
  console.log(\`Hello, \${name}\`)
}
`
    const results = findMethodCalls(code, ['console.log'])
    expect(results).toHaveLength(1)
    expect(results[0].methodName).toBe('console.log')
  })

  it('should handle JSX code', () => {
    const code = `
function App() {
  console.log('render')
  return <div>Hello</div>
}
`
    const results = findMethodCalls(code, ['console.log'])
    expect(results).toHaveLength(1)
  })

  it('should return correct start and end positions', () => {
    const code = `console.log('test')`
    const results = findMethodCalls(code, ['console.log'])
    expect(results).toHaveLength(1)
    expect(results[0].start).toBe(0)
    expect(results[0].end).toBe(11) // 'console.log'.length = 11
    expect(results[0].column).toBe(0)
  })
})
