#!/usr/bin/env node

/**
 * Remove console.log statements from production code
 * This script removes or comments out console statements for security
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directories to process
const API_DIR = path.join(__dirname, '../app/api');
const LIB_DIR = path.join(__dirname, '../lib');

// Files to process
const patterns = [
  `${API_DIR}/**/*.ts`,
  `${API_DIR}/**/*.tsx`,
  `${LIB_DIR}/**/*.ts`,
  `${LIB_DIR}/**/*.tsx`,
  `${LIB_DIR}/**/*.js`
];

let totalRemoved = 0;
let filesModified = 0;

console.log('🔍 Removing console statements from production code...\n');

patterns.forEach(pattern => {
  const files = glob.sync(pattern);
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Pattern to match console.log, console.error, console.warn, console.info
    const consolePattern = /console\.(log|error|warn|info)\([^)]*\);?/g;
    
    // Replace with a logger call (you should implement a proper logger)
    // For now, we'll comment them out in production
    content = content.replace(consolePattern, (match) => {
      // Keep console.error for critical errors
      if (match.includes('console.error')) {
        // Replace with proper error logging
        return `// TODO: Replace with proper error logging\n    // ${match}`;
      }
      // Remove other console statements
      return `// Removed for production: ${match}`;
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      const matches = originalContent.match(consolePattern) || [];
      totalRemoved += matches.length;
      filesModified++;
      console.log(`  ✅ ${path.relative(process.cwd(), file)} - Removed ${matches.length} console statements`);
    }
  });
});

console.log(`\n✨ Complete! Removed ${totalRemoved} console statements from ${filesModified} files`);
console.log('\n⚠️  Important: Review the changes and implement proper logging with winston or pino');
console.log('💡 Tip: Use environment-based logging levels in production\n');