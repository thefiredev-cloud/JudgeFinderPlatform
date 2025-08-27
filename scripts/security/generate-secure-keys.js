#!/usr/bin/env node

/**
 * Generate secure random keys for production environment
 * Run this to create new secure keys after rotating compromised ones
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Prevent execution during Netlify builds or production
if (process.env.NETLIFY_BUILD === 'true' || process.env.NETLIFY === 'true' || process.env.NODE_ENV === 'production') {
  // Exit silently without any output
  process.exit(0);
}

// Only log in development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

// Removed to prevent output during builds

// Generate secure random keys
const keys = {
  SYNC_API_KEY: crypto.randomBytes(32).toString('hex'),
  CRON_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_VERIFY_TOKEN: crypto.randomBytes(32).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  SENTRY_AUTH_TOKEN: crypto.randomBytes(32).toString('hex'),
};

// Never output actual keys to console
if (isDevelopment) {
  console.log('✅ Security keys generated (saved to file only)');
  console.log('Keys created for:', Object.keys(keys).join(', '));
}

// Save to a temporary file (will be deleted after viewing)
const tempFile = path.join(__dirname, `../.new-keys-${Date.now()}.env`);
const content = Object.entries(keys)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(tempFile, content);

if (isDevelopment) {
  console.log('\n✅ Keys saved temporarily to:', path.basename(tempFile));
  console.log('⚠️  IMPORTANT: Copy these keys to your hosting platform immediately');
  console.log('🗑️  Delete the temporary file after copying: rm', tempFile);
  console.log('\n🔒 Security Reminders:');
  console.log('   1. Never commit these keys to git');
  console.log('   2. Rotate these keys regularly');
  console.log('   3. Use different keys for staging and production');
  console.log('   4. Set up alerts for unauthorized API usage\n');
}