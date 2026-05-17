import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractScriptBlocks } from '../src/core/scriptExtractor'

const fixturesDir = resolve(__dirname, 'fixtures')

describe('extractScriptBlocks', () => {
  describe('Vue SFC', () => {
    const vueCode = readFileSync(resolve(fixturesDir, 'example.vue'), 'utf-8')

    it('should extract two script blocks from Vue SFC', () => {
      const blocks = extractScriptBlocks(vueCode)
      expect(blocks).toHaveLength(2)
    })

    it('should extract correct content from first script block', () => {
      const blocks = extractScriptBlocks(vueCode)
      expect(blocks[0].content).toContain('console.log(\'setup called\')')
      expect(blocks[0].content).toContain('export default')
    })

    it('should extract correct content from script setup block', () => {
      const blocks = extractScriptBlocks(vueCode)
      expect(blocks[1].content).toContain('console.log(\'script setup\')')
      expect(blocks[1].content).toContain('computed')
    })

    it('should have correct line offsets', () => {
      const blocks = extractScriptBlocks(vueCode)
      // First <script> content starts after template (4 lines) + <script> tag (1 line) = line 6
      expect(blocks[0].line).toBeGreaterThan(1)
      // Second <script setup> starts after first script block
      expect(blocks[1].line).toBeGreaterThan(blocks[0].line)
    })

    it('should have correct offset positions', () => {
      const blocks = extractScriptBlocks(vueCode)
      // offset should point to the start of the content within the file
      expect(blocks[0].offset).toBeGreaterThan(0)
      expect(blocks[1].offset).toBeGreaterThan(blocks[0].offset)
    })
  })

  describe('Svelte', () => {
    const svelteCode = readFileSync(resolve(fixturesDir, 'example.svelte'), 'utf-8')

    it('should extract one script block from Svelte', () => {
      const blocks = extractScriptBlocks(svelteCode)
      expect(blocks).toHaveLength(1)
    })

    it('should extract correct content', () => {
      const blocks = extractScriptBlocks(svelteCode)
      expect(blocks[0].content).toContain('console.log(\'svelte script\')')
      expect(blocks[0].content).toContain('onMount')
    })

    it('should have line offset of 1 (script is at top)', () => {
      const blocks = extractScriptBlocks(svelteCode)
      // Script tag is the first element, beforeScript is '<script>', which is 1 line
      expect(blocks[0].line).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('should return empty array when no script tags', () => {
      const code = `<template><div>Hello</div></template>
<style>.foo { color: red }</style>`
      const blocks = extractScriptBlocks(code)
      expect(blocks).toEqual([])
    })

    it('should handle script with attributes', () => {
      const code = `<script lang="ts" setup>
const x = 1
</script>`
      const blocks = extractScriptBlocks(code)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].content).toContain('const x = 1')
    })

    it('should handle empty script block', () => {
      const code = `<script></script>`
      const blocks = extractScriptBlocks(code)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].content).toBe('')
    })
  })
})
