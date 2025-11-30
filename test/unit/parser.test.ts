import { describe, expect, it } from 'vitest'
import { findMethodCalls } from '../../src/core/parser'
import { extractScriptBlocks } from '../../src/core/scriptExtractor'

describe('parser', () => {
  describe('findMethodCalls', () => {
    it('should find simple method calls', () => {
      const code = `
        function test() {
          console.log('hello')
        }
      `
      const calls = findMethodCalls(code, ['console.log'])
      expect(calls).toHaveLength(1)
      expect(calls[0].methodName).toBe('console.log')
    })

    it('should find multiple method calls', () => {
      const code = `
        console.log('first')
        console.log('second')
        console.log('third')
      `
      const calls = findMethodCalls(code, ['console.log'])
      expect(calls).toHaveLength(3)
    })

    it('should support dot notation', () => {
      const code = `
        console.log('test')
        console.error('error')
        logger.info.log('info')
      `
      const calls = findMethodCalls(code, ['console.log', 'logger.info.log'])
      expect(calls).toHaveLength(2)
      expect(calls[0].methodName).toBe('console.log')
      expect(calls[1].methodName).toBe('logger.info.log')
    })

    it('should not match partial names', () => {
      const code = `
        console.log('match')
        console.error('no match')
        myConsole.log('no match')
      `
      const calls = findMethodCalls(code, ['console.log'])
      expect(calls).toHaveLength(1)
    })

    it('should handle line offset', () => {
      const code = `console.log('test')`
      const calls = findMethodCalls(code, ['console.log'], 10)
      expect(calls[0].line).toBe(11) // 1 + 10 offset
    })

    it('should handle TypeScript syntax', () => {
      const code = `
        const test: string = 'hello'
        console.log(test)
      `
      const calls = findMethodCalls(code, ['console.log'])
      expect(calls).toHaveLength(1)
    })

    it('should handle JSX syntax', () => {
      const code = `
        function Component() {
          console.log('rendering')
          return <div>Hello</div>
        }
      `
      const calls = findMethodCalls(code, ['console.log'])
      expect(calls).toHaveLength(1)
    })
  })

  describe('extractScriptBlocks', () => {
    describe('vue SFC', () => {
      it('should extract single script block', () => {
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
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('console.log')
        expect(result[0].line).toBeGreaterThan(0)
      })

      it('should handle script setup', () => {
        const code = `
<template>
  <div>Test</div>
</template>

<script setup>
const msg = 'hello'
console.log(msg)
</script>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('console.log')
      })

      it('should handle multiple script blocks', () => {
        const code = `
<template>
  <div>Test</div>
</template>

<script>
export default {
  name: 'Component'
}
</script>

<script setup>
const msg = 'hello'
console.log(msg)
</script>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(2)
        expect(result[0].content).toContain('export default')
        expect(result[1].content).toContain('const msg')
      })

      it('should handle lang attribute', () => {
        const code = `
<template>
  <div>Test</div>
</template>

<script lang="ts">
const count: number = 0
console.log(count)
</script>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('const count: number')
      })

      it('should handle script setup with lang', () => {
        const code = `
<template>
  <div>Test</div>
</template>

<script setup lang="ts">
interface Props {
  msg: string
}
const props = defineProps<Props>()
console.log(props.msg)
</script>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('interface Props')
      })

      it('should handle attributes in any order', () => {
        const code = `
<template>
  <div>Test</div>
</template>

<script lang="ts" setup>
const msg = 'hello'
</script>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('const msg')
      })

      it('should calculate correct line offset', () => {
        const code = `<template>
  <div>Line 2</div>
</template>

<script>
console.log('Line 6')
</script>`
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].line).toBe(5) // Line where content starts (after opening tag)
      })

      it('should handle empty script tags', () => {
        const code = `
<template>
  <div>Test</div>
</template>

<script>
</script>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content.trim()).toBe('')
      })

      it('should return empty array if no script tag', () => {
        const code = `
<template>
  <div>Test</div>
</template>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(0)
      })
    })

    describe('svelte components', () => {
      it('should extract single script block', () => {
        const code = `
<script>
  let count = 0
  console.log('init')
</script>

<main>
  <h1>Count: {count}</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('console.log')
      })

      it('should handle module context', () => {
        const code = `
<script context="module">
  export const shared = 'module'
  console.log('module')
</script>

<main>
  <h1>Test</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('export const shared')
      })

      it('should handle multiple script blocks', () => {
        const code = `
<script context="module">
  export const shared = 'module'
</script>

<script>
  let count = 0
  console.log('init')
</script>

<main>
  <h1>Count: {count}</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(2)
        expect(result[0].content).toContain('export const shared')
        expect(result[1].content).toContain('let count')
      })

      it('should handle lang attribute', () => {
        const code = `
<script lang="ts">
  let count: number = 0
  console.log(count)
</script>

<main>
  <h1>Count: {count}</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('let count: number')
      })

      it('should handle module script with lang', () => {
        const code = `
<script context="module" lang="ts">
  export const shared: string = 'module'
</script>

<main>
  <h1>Test</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('export const shared: string')
      })

      it('should handle attributes in any order', () => {
        const code = `
<script lang="ts" context="module">
  export const shared = 'test'
</script>

<main>
  <h1>Test</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].content).toContain('export const shared')
      })

      it('should calculate correct line offset', () => {
        const code = `<script>
console.log('Line 2')
</script>

<main>
  <h1>Test</h1>
</main>`
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(1)
        expect(result[0].line).toBe(1) // Line where content starts (after opening tag)
      })

      it('should return empty array if no script tag', () => {
        const code = `
<main>
  <h1>Test</h1>
</main>
      `
        const result = extractScriptBlocks(code)
        expect(result).toHaveLength(0)
      })
    })
  })
})
