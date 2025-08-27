#!/usr/bin/env node

/**
 * Generate secure random keys for production deployment
 * This script creates cryptographically secure random keys for webhooks and API protection
 */

const crypto = require('crypto');

// Prevent execution during Netlify builds or production
if (process.env.NETLIFY_BUILD === 'true' || process.env.NETLIFY === 'true' || process.env.NODE_ENV === 'production') {
  // Exit silently without any output
  process.exit(0);
}

// Only log in development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Removed to prevent any output during builds

// Generate secure 32-byte (256-bit) random keys
const keys = {
  SYNC_API_KEY: crypto.randomBytes(32).toString('hex'),
  CRON_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_VERIFY_TOKEN: crypto.randomBytes(32).toString('hex'),
};

// Never output actual keys to console
if (isDevelopment) {
  console.log('✅ Security keys generated (saved to file only)');
  console.log('Keys created for:', Object.keys(keys).join(', '));
}

// Removed detailed logging to prevent secrets exposure

// Save to file for reference (will be gitignored)
const fs = require('fs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `.production-keys-${timestamp}.txt`;

const fileContent = `# JudgeFinder Platform - Production Keys Generated ${new Date().toISOString()}
# SECURITY: Delete this file after copying keys to production environment

${Object.entries(keys).map(([key, value]) => `${key}=${value}`).join('\n')}

# Generated with: node scripts/generate-production-secrets.js
# Entropy: 256-bit per key
# Algorithm: crypto.randomBytes(32).toString('hex')
`;

fs.writeFileSync(filename, fileContent);
if (isDevelopment) {
  console.log(`💾 Keys saved to: ${filename} (check file for actual keys)`);
}