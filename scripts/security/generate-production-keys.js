const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 GENERATING PRODUCTION SECURITY KEYS\n');
console.log('=' .repeat(60));

// Generate secure random keys
const keys = {
  SYNC_API_KEY: crypto.randomBytes(32).toString('hex'),
  CRON_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
  COURTLISTENER_WEBHOOK_VERIFY_TOKEN: crypto.randomBytes(32).toString('hex'),
  SENTRY_AUTH_TOKEN: crypto.randomBytes(32).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex')
};

// Display keys
console.log('\n📋 Generated Security Keys:\n');
for (const [key, value] of Object.entries(keys)) {
  console.log(`${key}=${value}`);
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

console.log('\n✅ Keys saved to PRODUCTION_KEYS.txt');
console.log('📌 Next steps:');
console.log('1. Copy these keys to your production environment');
console.log('2. Update .env.production with these values');
console.log('3. Configure remaining service keys from their dashboards');
console.log('\n⚠️ SECURITY REMINDER: Never commit these keys to git!');