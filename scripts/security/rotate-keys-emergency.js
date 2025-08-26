#!/usr/bin/env node

/**
 * Emergency Key Rotation Script
 * Use this when keys have been exposed
 * 
 * Usage: node scripts/rotate-keys-emergency.js [service]
 * Examples:
 *   node scripts/rotate-keys-emergency.js          # Interactive mode
 *   node scripts/rotate-keys-emergency.js stripe   # Rotate specific service
 *   node scripts/rotate-keys-emergency.js all      # Rotate all services
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Service configuration with rotation instructions
const SERVICES = {
  stripe: {
    name: 'Stripe',
    priority: 'CRITICAL',
    url: 'https://dashboard.stripe.com/apikeys',
    keys: [
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ],
    instructions: `
    1. Login to Stripe Dashboard
    2. Go to Developers → API keys
    3. Roll secret key (generates new immediately)
    4. Copy new keys
    5. Update webhook endpoint secret
    6. Check for unauthorized transactions`
  },
  
  openai: {
    name: 'OpenAI',
    priority: 'HIGH',
    url: 'https://platform.openai.com/api-keys',
    keys: ['OPENAI_API_KEY'],
    instructions: `
    1. Go to OpenAI API keys page
    2. Delete compromised key
    3. Create new key with spending limit ($100/month)
    4. Set usage alerts
    5. Check usage dashboard for unauthorized calls`
  },
  
  supabase: {
    name: 'Supabase',
    priority: 'CRITICAL',
    url: 'https://app.supabase.com/project/[project-id]/settings/api',
    keys: [
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ],
    instructions: `
    1. Login to Supabase Dashboard
    2. Go to Settings → API
    3. Regenerate JWT secret
    4. Get new service role key
    5. Update anon key if needed
    6. Check audit logs`
  },
  
  clerk: {
    name: 'Clerk',
    priority: 'HIGH',
    url: 'https://dashboard.clerk.com',
    keys: [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY'
    ],
    instructions: `
    1. Login to Clerk Dashboard
    2. Go to API Keys section
    3. Generate new production keys
    4. Update publishable and secret keys
    5. Check user sessions`
  },
  
  sendgrid: {
    name: 'SendGrid',
    priority: 'MEDIUM',
    url: 'https://app.sendgrid.com/settings/api_keys',
    keys: ['SENDGRID_API_KEY', 'EMAIL_API_KEY'],
    instructions: `
    1. Login to SendGrid
    2. Go to Settings → API Keys
    3. Delete compromised key
    4. Create new key with restricted permissions
    5. Check email activity`
  },
  
  courtlistener: {
    name: 'CourtListener',
    priority: 'LOW',
    url: 'https://www.courtlistener.com/api/',
    keys: ['COURTLISTENER_API_KEY'],
    instructions: `
    1. Login to CourtListener
    2. Request new API key
    3. Update rate limits if needed`
  },
  
  upstash: {
    name: 'Upstash Redis',
    priority: 'MEDIUM',
    url: 'https://console.upstash.com',
    keys: [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ],
    instructions: `
    1. Login to Upstash Console
    2. Select your database
    3. Regenerate REST token
    4. Update connection string`
  },
  
  sentry: {
    name: 'Sentry',
    priority: 'LOW',
    url: 'https://sentry.io',
    keys: [
      'SENTRY_DSN',
      'SENTRY_AUTH_TOKEN'
    ],
    instructions: `
    1. Login to Sentry
    2. Go to Settings → Projects → [project] → Client Keys
    3. Generate new DSN if needed
    4. Create new auth token`
  }
};

// Generate secure random keys
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/[/+=]/g, '');
}

// Create backup of current env file
function backupEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Backed up .env to ${backupPath}`);
    return backupPath;
  }
  return null;
}

// Create new secure .env.local file
function createSecureEnvFile() {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example not found. Please create it first.');
    return false;
  }
  
  // Copy example to .env.local
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log(`✅ Created .env.local from .env.example`);
  console.log('⚠️  Remember to fill in your new API keys!');
  
  return true;
}

// Check if keys are exposed in files
function scanForExposedKeys() {
  console.log('\n🔍 Scanning for exposed keys in repository...\n');
  
  const exposedFiles = [];
  const patterns = [
    /sk_live_[0-9a-zA-Z]{24,}/g,
    /sk-[a-zA-Z0-9]{20,}/g,
    /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
  ];
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDir(filePath);
      } else if (stat.isFile() && !file.includes('.env.example')) {
        const content = fs.readFileSync(filePath, 'utf8');
        patterns.forEach(pattern => {
          if (pattern.test(content)) {
            exposedFiles.push(filePath);
          }
        });
      }
    });
  }
  
  try {
    scanDir('.');
    
    if (exposedFiles.length > 0) {
      console.log('⚠️  Found potential exposed keys in:');
      exposedFiles.forEach(file => console.log(`   - ${file}`));
    } else {
      console.log('✅ No exposed keys found in tracked files');
    }
  } catch (error) {
    console.error('Error scanning files:', error.message);
  }
}

// Display rotation instructions for a service
function displayRotationInstructions(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    console.error(`❌ Unknown service: ${serviceName}`);
    return;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 Rotating ${service.name} Keys`);
  console.log(`Priority: ${service.priority}`);
  console.log(`URL: ${service.url}`);
  console.log(`${'='.repeat(60)}`);
  
  console.log('\nKeys to rotate:');
  service.keys.forEach(key => console.log(`  - ${key}`));
  
  console.log('\nInstructions:');
  console.log(service.instructions);
  
  console.log('\nGenerated secure keys for internal use:');
  console.log(`SYNC_API_KEY=${generateSecureKey()}`);
  console.log(`CRON_SECRET=${generateSecureKey()}`);
  console.log(`SESSION_SECRET=${generateSecureKey(64)}`);
}

// Interactive rotation wizard
async function interactiveRotation() {
  console.log('\n🚨 Emergency Key Rotation Wizard');
  console.log('=================================\n');
  
  console.log('Services by priority:');
  console.log('1. CRITICAL: Stripe, Supabase');
  console.log('2. HIGH: OpenAI, Clerk');
  console.log('3. MEDIUM: SendGrid, Upstash');
  console.log('4. LOW: CourtListener, Sentry');
  console.log('5. ALL: Rotate everything');
  console.log('0. Exit\n');
  
  return new Promise((resolve) => {
    rl.question('Select option (0-5): ', (answer) => {
      switch(answer) {
        case '1':
          displayRotationInstructions('stripe');
          displayRotationInstructions('supabase');
          break;
        case '2':
          displayRotationInstructions('openai');
          displayRotationInstructions('clerk');
          break;
        case '3':
          displayRotationInstructions('sendgrid');
          displayRotationInstructions('upstash');
          break;
        case '4':
          displayRotationInstructions('courtlistener');
          displayRotationInstructions('sentry');
          break;
        case '5':
          Object.keys(SERVICES).forEach(service => {
            displayRotationInstructions(service);
          });
          break;
        case '0':
          console.log('Exiting...');
          break;
        default:
          console.log('Invalid option');
      }
      resolve();
    });
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🛡️  JudgeFinder Emergency Key Rotation');
  console.log('=======================================\n');
  
  // Backup current environment
  const backupPath = backupEnvFile();
  
  // Scan for exposed keys
  scanForExposedKeys();
  
  if (!command) {
    // Interactive mode
    await interactiveRotation();
  } else if (command === 'all') {
    // Rotate all services
    Object.keys(SERVICES).forEach(service => {
      displayRotationInstructions(service);
    });
  } else if (SERVICES[command]) {
    // Rotate specific service
    displayRotationInstructions(command);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Available services:', Object.keys(SERVICES).join(', '));
  }
  
  // Create secure env file
  console.log('\n📝 Creating secure environment file...');
  createSecureEnvFile();
  
  // Final checklist
  console.log('\n✅ Post-Rotation Checklist:');
  console.log('[ ] All critical keys rotated (Stripe, Supabase)');
  console.log('[ ] New keys added to Netlify environment variables');
  console.log('[ ] Old .env file deleted or secured');
  console.log('[ ] Git history cleaned (if needed)');
  console.log('[ ] All services tested with new keys');
  console.log('[ ] Monitoring enabled for unauthorized usage');
  console.log('[ ] 2FA enabled on all service accounts');
  
  console.log('\n🔒 Security Reminders:');
  console.log('- Never commit real API keys');
  console.log('- Use .env.local for development');
  console.log('- Store production keys in Netlify only');
  console.log('- Rotate keys quarterly');
  console.log('- Set spending limits on all services');
  
  rl.close();
}

// Run the script
main().catch(console.error);