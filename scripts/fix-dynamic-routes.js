const fs = require('fs')
const path = require('path')

function addDynamicExport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if file already has export const dynamic
    if (content.includes('export const dynamic')) {
      console.log(`✓ Already has dynamic export: ${filePath}`)
      return false
    }
    
    // Find the import statements and add dynamic export after them
    const lines = content.split('\n')
    let importEndIndex = -1
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('const ') && lines[i].includes('require(')) {
        importEndIndex = i
      }
    }
    
    if (importEndIndex === -1) {
      // No imports found, add at the beginning
      importEndIndex = 0
    }
    
    // Insert the dynamic export
    lines.splice(importEndIndex + 1, 0, '', 'export const dynamic = \'force-dynamic\'')
    
    // Write the file back
    fs.writeFileSync(filePath, lines.join('\n'))
    console.log(`✅ Added dynamic export: ${filePath}`)
    return true
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return false
  }
}

function findApiRoutes(dir) {
  const routes = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (item === 'route.ts' || item === 'route.js') {
        routes.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return routes
}

function main() {
  console.log('🔧 Fixing dynamic server usage errors in API routes...')
  
  const apiDir = path.join(__dirname, '..', 'app', 'api')
  const routes = findApiRoutes(apiDir)
  
  console.log(`Found ${routes.length} API routes`)
  
  let fixed = 0
  for (const route of routes) {
    if (addDynamicExport(route)) {
      fixed++
    }
  }
  
  console.log(`\\n🎉 Fixed ${fixed} API routes`)
  console.log('Now try running: npm run build')
}

main()