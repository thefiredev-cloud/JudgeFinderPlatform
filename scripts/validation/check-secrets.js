#!/usr/bin/env node

/**
 * Pre-commit hook to detect exposed API keys and secrets
 * Install: Add to .git/hooks/pre-commit or use with husky
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns that indicate exposed secrets
const SECRET_PATTERNS = [
  // Stripe
  /sk_live_[0-9a-zA-Z]{24,}/g,
  /sk_test_[0-9a-zA-Z]{24,}/g,
  /pk_live_[0-9a-zA-Z]{24,}/g,
  /pk_test_[0-9a-zA-Z]{24,}/g,
  /whsec_[0-9a-zA-Z]{24,}/g,
  
  // OpenAI
  /sk-[a-zA-Z0-9]{20,}/g,
  /sk-proj-[a-zA-Z0-9]{48,}/g,
  
  // Supabase (JWT tokens)
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  
  // SendGrid
  /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
  
  // Generic API keys
  /api[_-]?key[_-]?[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
  /secret[_-]?key[_-]?[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
  /token[_-]?[=:]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi,
  
  // AWS
  /AKIA[0-9A-Z]{16}/g,
  
  // GitHub
  /ghp_[a-zA-Z0-9]{36}/g,
  /gho_[a-zA-Z0-9]{36}/g,
  /ghs_[a-zA-Z0-9]{36}/g,
  
  // Generic secrets
  /password\s*[=:]\s*['"][^'"]{8,}['"]/gi,
  /pwd\s*[=:]\s*['"][^'"]{8,}['"]/gi,
  /passwd\s*[=:]\s*['"][^'"]{8,}['"]/gi,
];

// Files to exclude from checking
const EXCLUDED_FILES = [
  '.env.example',
  'package-lock.json',
  'yarn.lock',
  '*.test.js',
  '*.spec.js',
  '*.md',
  'check-secrets.js',
];

// Directories to exclude
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.cache',
];

function shouldCheckFile(filePath) {
  const basename = path.basename(filePath);
  const dirname = path.dirname(filePath);
  
  // Check if file is in excluded directory
  for (const dir of EXCLUDED_DIRS) {
    if (filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)) {
      return false;
    }
  }
  
  // Check if file matches excluded patterns
  for (const pattern of EXCLUDED_FILES) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(basename)) {
        return false;
      }
    } else if (basename === pattern) {
      return false;
    }
  }
  
  // Only check text files
  const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.yml', '.yaml', '.toml', '.ini', '.conf', '.config', '.sh', '.bash'];
  return textExtensions.some(ext => filePath.endsWith(ext));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];
    
    SECRET_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Find line number
          const lines = content.split('\n');
          const lineNumber = lines.findIndex(line => line.includes(match)) + 1;
          
          findings.push({
            file: filePath,
            line: lineNumber,
            match: match.substring(0, 20) + '...',
            pattern: pattern.source.substring(0, 30) + '...'
          });
        });
      }
    });
    
    return findings;
  } catch (error) {
    return [];
  }
}

function getGitStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    // If not in a git repo or no staged files, return empty
    return [];
  }
}

function scanAllFiles() {
  const allFindings = [];
  
  // Get staged files for pre-commit hook
  const stagedFiles = getGitStagedFiles();
  
  if (stagedFiles.length > 0) {
    console.log(`🔍 Scanning ${stagedFiles.length} staged files for secrets...`);
    
    stagedFiles.forEach(file => {
      if (shouldCheckFile(file) && fs.existsSync(file)) {
        const findings = scanFile(file);
        allFindings.push(...findings);
      }
    });
  } else {
    // If not in git context, scan current directory
    console.log('🔍 Scanning current directory for secrets...');
    
    function walkDir(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!EXCLUDED_DIRS.includes(file)) {
            walkDir(filePath);
          }
        } else if (shouldCheckFile(filePath)) {
          const findings = scanFile(filePath);
          allFindings.push(...findings);
        }
      });
    }
    
    walkDir('.');
  }
  
  return allFindings;
}

// Main execution
console.log('🛡️  JudgeFinder Secret Scanner');
console.log('================================\n');

const findings = scanAllFiles();

if (findings.length > 0) {
  console.error('❌ SECRETS DETECTED! Commit blocked.\n');
  console.error('Found potential secrets in the following locations:\n');
  
  findings.forEach(finding => {
    console.error(`📁 ${finding.file}:${finding.line}`);
    console.error(`   Match: ${finding.match}`);
    console.error(`   Pattern: ${finding.pattern}\n`);
  });
  
  console.error('🔒 How to fix:');
  console.error('1. Move secrets to .env.local (for development)');
  console.error('2. Use .env.example for templates with dummy values');
  console.error('3. Add production secrets to Netlify environment variables');
  console.error('4. Make sure .env files are in .gitignore');
  console.error('5. Run "git reset HEAD <file>" to unstage files with secrets\n');
  
  process.exit(1);
} else {
  console.log('✅ No secrets detected in staged files');
  console.log('Safe to commit!\n');
  process.exit(0);
}