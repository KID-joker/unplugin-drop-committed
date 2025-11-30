import type { ScriptBlock } from '../types'

interface ScriptTag {
  start: number
  end: number
  contentStart: number
  contentEnd: number
}

/**
 * Extract all script blocks from HTML-like files (Vue SFC, Svelte components, etc.)
 * This is a shared utility used by both Vue and Svelte parsers
 */
export function extractScriptBlocks(code: string): ScriptBlock[] {
  const scripts = parseScriptTags(code)

  if (scripts.length === 0) {
    return []
  }

  return scripts.map((scriptTag) => {
    const content = code.slice(scriptTag.contentStart, scriptTag.contentEnd)

    // Calculate line offset (how many lines before the script content)
    const beforeScript = code.slice(0, scriptTag.contentStart)
    const line = beforeScript.split('\n').length

    return {
      content,
      offset: scriptTag.contentStart,
      line,
    }
  })
}

/**
 * Parse all script tags in the code
 */
function parseScriptTags(code: string): ScriptTag[] {
  const scripts: ScriptTag[] = []

  // Match <script> opening tags with optional attributes
  const scriptOpenRegex = /<script(?:\s[^>]*)?>/gi
  let match: RegExpExecArray | null

  match = scriptOpenRegex.exec(code)
  while (match !== null) {
    const openTagStart = match.index
    const openTagEnd = openTagStart + match[0].length

    // Find corresponding closing tag
    const closeTagRegex = /<\/script\s*>/i
    const closeMatch = closeTagRegex.exec(code.slice(openTagEnd))

    if (!closeMatch) {
      continue
    }

    const contentStart = openTagEnd
    const contentEnd = openTagEnd + closeMatch.index
    const closeTagEnd = contentEnd + closeMatch[0].length

    scripts.push({
      start: openTagStart,
      end: closeTagEnd,
      contentStart,
      contentEnd,
    })

    // Move to next match
    match = scriptOpenRegex.exec(code)
  }

  return scripts
}
