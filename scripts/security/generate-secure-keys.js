#!/usr/bin/env node

/**
 * Generate secure random keys for production environment
 * Run this to create new secure keys after rotating compromised ones
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating new secure keys for production...\n');

// Generate secure random keys
const keys = {
  SYNC_API_KEY: crypto.randomBytes(32).toString('hex'),
  CRON_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_VERIFY_TOKEN: crypto.randomBytes(32).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  SENTRY_AUTH_TOKEN: crypto.randomBytes(32).toString('hex'),
};

// Display keys for copying
console.log('📋 Copy these keys to your production environment:\n');
console.log('=' .repeat(60));

Object.entries(keys).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('=' .repeat(60));

// Save to a temporary file (will be deleted after viewing)
const tempFile = path.join(__dirname, `../.new-keys-${Date.now()}.env`);
const content = Object.entries(keys)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(tempFile, content);

console.log('\n✅ Keys saved temporarily to:', path.basename(tempFile));
console.log('⚠️  IMPORTANT: Copy these keys to your hosting platform immediately');
console.log('🗑️  Delete the temporary file after copying: rm', tempFile);
console.log('\n🔒 Security Reminders:');
console.log('   1. Never commit these keys to git');
console.log('   2. Rotate these keys regularly');
console.log('   3. Use different keys for staging and production');
console.log('   4. Set up alerts for unauthorized API usage\n');