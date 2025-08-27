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

// Generate secure random keys
const keys = {
  SYNC_API_KEY: crypto.randomBytes(32).toString('hex'),
  CRON_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_VERIFY_TOKEN: crypto.randomBytes(32).toString('hex'),
  SENTRY_AUTH_TOKEN: crypto.randomBytes(32).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex')
};

// Never display actual keys in console
if (isDevelopment) {
  console.log('\n📋 Security keys generated successfully (saved to file only)\n');
  console.log('Keys generated for:', Object.keys(keys).join(', '));
}

// Create production keys file
const productionKeysPath = path.join(__dirname, '..', 'PRODUCTION_KEYS.txt');
const content = `# PRODUCTION SECURITY KEYS
# Generated: ${new Date().toISOString()}
# ⚠️ IMPORTANT: Add these to your production environment variables
# ⚠️ DO NOT commit this file to version control

${Object.entries(keys).map(([k, v]) => `${k}=${v}`).join('\n')}

# Additional keys to configure manually:
# - CLERK_SECRET_KEY (from Clerk dashboard)
# - STRIPE_SECRET_KEY (from Stripe dashboard)
# - OPENAI_API_KEY (from OpenAI dashboard)
# - SENTRY_DSN (from Sentry dashboard)
# - UPSTASH_REDIS_REST_TOKEN (from Upstash dashboard)
`;

fs.writeFileSync(productionKeysPath, content);

if (isDevelopment) {
  console.log('\n✅ Keys saved to PRODUCTION_KEYS.txt');
  console.log('⚠️ Check the file for your generated keys - never commit to git!');
}