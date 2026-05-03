import { parse } from '@babel/parser'
import babelTraverse from '@babel/traverse'
import type { CallExpression, MemberExpression, Node } from '@babel/types'
import type { MethodCallLocation } from '../types'

const traverse = typeof babelTraverse === 'function' ? babelTraverse : (babelTraverse as any).default

/**
 * Get the full method name from a member expression
 * e.g., console.log -> 'console.log'
 *       obj.method.call -> 'obj.method.call'
 */
function getMemberExpressionName(node: MemberExpression): string {
  const parts: string[] = []

  let current: Node = node
  while (current.type === 'MemberExpression') {
    if (current.property.type === 'Identifier') {
      parts.unshift(current.property.name)
    }
    current = current.object
  }

  if (current.type === 'Identifier') {
    parts.unshift(current.name)
  }

  return parts.join('.')
}

/**
 * Find all method call locations in the code
 */
export function findMethodCalls(
  code: string,
  methodNames: string[],
  lineOffset: number = 0,
): MethodCallLocation[] {
  const locations: MethodCallLocation[] = []

  try {
    // Parse code with Babel
    const ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
      ],
      errorRecovery: true,
    })

    // Traverse AST to find call expressions
    traverse(ast, {
      CallExpression(path: any) {
        const node = path.node as CallExpression

        // Check if callee is a member expression (e.g., console.log)
        if (node.callee.type === 'MemberExpression') {
          const methodName = getMemberExpressionName(node.callee)

          // Check if this method should be removed
          if (methodNames.includes(methodName)) {
            const loc = node.loc
            if (loc) {
              locations.push({
                start: node.callee.start!,
                end: node.callee.end!,
                line: loc.start.line + lineOffset,
                column: loc.start.column,
                methodName,
              })
            }
          }
        }
        // Also check for simple identifiers (e.g., log())
        else if (node.callee.type === 'Identifier') {
          const methodName = node.callee.name

          if (methodNames.includes(methodName)) {
            const loc = node.loc
            if (loc) {
              locations.push({
                start: node.callee.start!,
                end: node.callee.end!,
                line: loc.start.line + lineOffset,
                column: loc.start.column,
                methodName,
              })
            }
          }
        }
      },
    })
  }
  catch (error) {
    console.warn('Failed to parse code:', error)
  }

  return locations
}
