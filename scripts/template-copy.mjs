#!/usr/bin/env node
/**
 * Cross-platform template copier for .codex templates.
 *
 * Examples:
 *  - npm run template:api -- judges/by-slug
 *  - npm run template:component -- JudgeSummary
 *  - npm run template:sync -- update-recent-decisions
 */

import fs from 'node:fs'
import path from 'node:path'

const [,, type, nameArg] = process.argv

function usage() {
  console.log('Usage: node scripts/template-copy.mjs <api|component|sync> <name>')
  console.log('  api:       name like "judges/new-endpoint" -> app/api/judges/new-endpoint/route.ts')
  console.log('  component: component name like "JudgeSummary" -> components/judges/JudgeSummary.tsx')
  console.log('  sync:      name like "sync-new-data" -> scripts/sync-new-data.js')
}

if (!type || !['api', 'component', 'sync'].includes(type) || !nameArg) {
  usage()
  process.exit(1)
}

const root = process.cwd()

function toPascalCase(input) {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function copyWithPlaceholders(src, dest, replacements) {
  const content = fs.readFileSync(src, 'utf8')
  const replaced = Object.entries(replacements).reduce((acc, [k, v]) => acc.replaceAll(k, v), content)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, replaced, 'utf8')
  console.log(`Created ${path.relative(root, dest)}`)
}

try {
  if (type === 'api') {
    const endpointPath = nameArg.replace(/^\/+|\/+$/g, '') // trim slashes
    const src = path.join(root, '.codex', 'api-template.ts')
    const dest = path.join(root, 'app', 'api', endpointPath, 'route.ts')
    if (fs.existsSync(dest)) {
      console.error(`Refusing to overwrite existing file: ${path.relative(root, dest)}`)
      process.exit(1)
    }
    copyWithPlaceholders(src, dest, {
      '%%ENDPOINT_PATH%%': `/api/${endpointPath}`
    })
  } else if (type === 'component') {
    const componentName = toPascalCase(nameArg)
    const src = path.join(root, '.codex', 'judge-component.tsx')
    const dest = path.join(root, 'components', 'judges', `${componentName}.tsx`)
    if (fs.existsSync(dest)) {
      console.error(`Refusing to overwrite existing file: ${path.relative(root, dest)}`)
      process.exit(1)
    }
    copyWithPlaceholders(src, dest, {
      '%%COMPONENT_NAME%%': componentName
    })
  } else if (type === 'sync') {
    const scriptName = nameArg.replace(/\.(js|mjs|cjs)$/i, '')
    const src = path.join(root, '.codex', 'sync-template.js')
    const dest = path.join(root, 'scripts', `${scriptName}.js`)
    if (fs.existsSync(dest)) {
      console.error(`Refusing to overwrite existing file: ${path.relative(root, dest)}`)
      process.exit(1)
    }
    copyWithPlaceholders(src, dest, {
      '%%SCRIPT_NAME%%': scriptName
    })
  }
} catch (err) {
  console.error('Template copy failed:', err)
  process.exit(1)
}

