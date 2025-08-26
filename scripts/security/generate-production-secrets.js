#!/usr/bin/env node

/**
 * Generate secure random keys for production deployment
 * This script creates cryptographically secure random keys for webhooks and API protection
 */

const crypto = require('crypto');

console.log('🔐 JudgeFinder Platform - Production Security Key Generator\n');

// Generate secure 32-byte (256-bit) random keys
const keys = {
  SYNC_API_KEY: crypto.randomBytes(32).toString('hex'),
  CRON_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_VERIFY_TOKEN: crypto.randomBytes(32).toString('hex'),
};

console.log('Generated secure keys for production:\n');
console.log('# Copy these values to your production environment variables');
console.log('# DO NOT commit these keys to version control\n');

Object.entries(keys).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📋 Deployment Checklist:');
console.log('1. Copy these keys to your deployment platform (Vercel/Netlify/etc.)');
console.log('2. Set NODE_ENV=production');
console.log('3. Configure your production Supabase and Clerk keys');
console.log('4. Set up your production domain URL');
console.log('5. Enable analytics and monitoring services');

console.log('\n⚠️  Security Notes:');
console.log('- These keys are cryptographically secure (256-bit entropy)');
console.log('- Each key is unique and should be used only once');
console.log('- Store keys securely in your deployment platform\'s env vars');
console.log('- Never expose these keys in client-side code');
console.log('- Rotate keys quarterly for enhanced security');

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
console.log(`\n💾 Keys saved to: ${filename}`);
console.log('   (This file is gitignored and should be deleted after use)');