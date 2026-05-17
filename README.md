# unplugin-drop-committed

[![npm version](https://img.shields.io/npm/v/unplugin-drop-committed.svg)](https://www.npmjs.com/package/unplugin-drop-committed)
[![License](https://img.shields.io/npm/l/unplugin-drop-committed.svg)](https://github.com/KID-joker/unplugin-drop-committed/blob/main/LICENSE)

🔌 An unplugin that automatically removes committed code (like `console.log`) from your codebase based on Git history.

## Features

✨ **Multiple Removal Modes**: Choose how to identify code to remove
- 🎯 **Strict Mode**: Remove code on committed lines
- 📁 **File Mode**: Remove code from committed files
- 👤 **User Mode**: Remove code from other authors
- ⏰ **Time Mode**: Remove code older than a specified time

🚀 **Framework Agnostic**: Works with Vite, Webpack, Rollup, Rspack, and more

🎨 **File Type Support**: JavaScript, TypeScript, JSX, Vue, and Svelte

⚡ **Performance Optimized**: Git operation caching and incremental processing

🛡️ **Dev Only**: Automatically disabled in production builds

## Installation

```bash
npm install unplugin-drop-committed --save-dev
```

## Usage

### Vite

```ts
// vite.config.ts
import DropCommitted from 'unplugin-drop-committed/vite'

export default defineConfig({
  plugins: [
    DropCommitted({
      mode: 'strict',
      removeMethods: ['console.log'],
    }),
  ],
})
```

### Webpack

```js
// webpack.config.js
module.exports = {
  plugins: [
    require('unplugin-drop-committed/webpack')({
      mode: 'strict',
      removeMethods: ['console.log'],
    }),
  ],
}
```

### Rollup

```js
// rollup.config.js
import DropCommitted from 'unplugin-drop-committed/rollup'

export default {
  plugins: [
    DropCommitted({
      mode: 'strict',
      removeMethods: ['console.log'],
    }),
  ],
}
```

## Configuration

```ts
interface Options {
  /**
   * Removal mode
   * @default 'strict'
   */
  mode?: 'strict' | 'file' | 'user' | 'time'

  /**
   * Method names to remove (supports dot notation)
   * @default ['console.log']
   */
  removeMethods?: string[]

  /**
   * File inclusion patterns
   * @default [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.svelte$/]
   */
  include?: (string | RegExp)[]

  /**
   * File exclusion patterns
   * @default []
   */
  exclude?: (string | RegExp)[]

  /**
   * Expiration time for 'time' mode
   * Supports: ISO dates, relative time (e.g., '30d', '1y', '6M')
   */
  expiration?: string
}
```

## Removal Modes

### Strict Mode (Default)

Removes method calls on lines that have been committed to Git.

```ts
DropCommitted({
  mode: 'strict',
  removeMethods: ['console.log'],
})
```

**Example:**
```js
// If this line is committed:
console.log('This will be removed') // ✅ Removed

// If this line is uncommitted:
console.log('This will stay') // ❌ Kept
```

### File Mode

Removes all method calls from files that are fully committed (not modified, added, or deleted).

```ts
DropCommitted({
  mode: 'file',
})
```

**Use case**: Clean up debug logs from stable files while keeping them in files you're actively working on.

### User Mode

Removes method calls authored by other developers (based on Git blame).

```ts
DropCommitted({
  mode: 'user',
})
```

**Use case**: Remove debug logs from other team members while keeping your own.

### Time Mode

Removes method calls older than a specified time.

```ts
DropCommitted({
  mode: 'time',
  expiration: '30d', // Remove logs older than 30 days
})
```

**Supported formats:**
- ISO dates: `'2024-01-01'`
- Relative days: `'30d'`
- Relative months: `'6M'`
- Relative years: `'1y'`

## Advanced Usage

### Custom Method Names

Remove any method calls, including nested ones:

```ts
DropCommitted({
  removeMethods: [
    'console.log',
    'console.debug',
    'logger.info',
    'debug.trace',
  ],
})
```

### File Patterns

Customize which files to process:

```ts
DropCommitted({
  include: [/\.[jt]sx?$/, /\.vue$/],
  exclude: ['**/*.test.js', '**/*.spec.ts'],
})
```

### Vue and Svelte Support

The plugin automatically extracts and processes `<script>` blocks:

```vue
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  mounted() {
    console.log('Component mounted') // Will be removed if committed
  }
}
</script>
```

## How It Works

1. **Environment Check**: Only runs in development mode
2. **Git Integration**: Uses Git blame and status to determine removal
3. **AST Parsing**: Uses Babel to accurately find method calls
4. **Smart Replacement**: Replaces calls with `((..._args) => {})` to maintain code structure
5. **Caching**: Caches Git operations for better performance

## Performance

The plugin implements several optimizations:

- ✅ Git operation results are cached
- ✅ Automatic skip in production builds

## Requirements

- Node.js >= 18
- Git repository
- Development environment (automatically skipped in production)

## Examples

### Remove old debug logs

```ts
DropCommitted({
  mode: 'time',
  expiration: '90d',
  removeMethods: ['console.log', 'console.debug'],
})
```

### Clean up team logs

```ts
DropCommitted({
  mode: 'user',
  removeMethods: ['console.log', 'debugger'],
})
```

### Production-ready files only

```ts
DropCommitted({
  mode: 'file',
  removeMethods: ['console.log', 'console.warn'],
})
```

## License

MIT License © 2024 [KID-joker](https://github.com/KID-joker)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [unplugin](https://github.com/unjs/unplugin) - Unified plugin system for build tools
