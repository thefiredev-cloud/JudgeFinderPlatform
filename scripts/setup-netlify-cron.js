#!/usr/bin/env node

/**
 * Setup Netlify Scheduled Functions
 * Configures automated sync schedule for production
 */

const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

console.log(`${colors.cyan}${colors.bright}⏰ Netlify Scheduled Functions Setup${colors.reset}`)
console.log('=====================================\n')

// Check if netlify.toml exists
const netlifyTomlPath = path.join(process.cwd(), 'netlify.toml')
const hasNetlifyToml = fs.existsSync(netlifyTomlPath)

if (!hasNetlifyToml) {
  console.log(`${colors.yellow}Creating netlify.toml configuration...${colors.reset}`)
  
  const netlifyConfig = `# Netlify Configuration
# https://docs.netlify.com/configure-builds/file-based-configuration/

[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"

# Scheduled Functions
[functions]
  directory = "netlify/functions"
  
  # Daily sync at 2:00 AM PST
  [functions."scheduled-sync"]
    schedule = "0 10 * * *"

# Environment Variables (set in Netlify UI)
# Required for scheduled functions:
# - CRON_SECRET
# - NEXT_PUBLIC_SITE_URL
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - COURTLISTENER_API_KEY

# Headers for security
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-store, max-age=0"

# Redirects
[[redirects]]
  from = "/admin"
  to = "/admin/dashboard"
  status = 301

[[redirects]]
  from = "/judge/*"
  to = "/judges/:splat"
  status = 301

# Edge Functions (optional)
[[edge_functions]]
  path = "/api/judges/list"
  function = "cache-judges"

[[edge_functions]]
  path = "/api/courts/list"
  function = "cache-courts"
`

  fs.writeFileSync(netlifyTomlPath, netlifyConfig)
  console.log(`${colors.green}✅ Created netlify.toml${colors.reset}`)
} else {
  console.log(`${colors.blue}ℹ️  netlify.toml already exists${colors.reset}`)
  
  // Check if scheduled functions are configured
  const content = fs.readFileSync(netlifyTomlPath, 'utf8')
  if (!content.includes('scheduled-sync')) {
    console.log(`${colors.yellow}⚠️  Scheduled sync not configured in netlify.toml${colors.reset}`)
    console.log('Add the following to your netlify.toml:\n')
    console.log(`[functions."scheduled-sync"]
  schedule = "0 10 * * *"`)
  }
}

// Create CRON_SECRET if not exists
const envPath = path.join(process.cwd(), '.env.production')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  if (!envContent.includes('CRON_SECRET')) {
    const cronSecret = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64')
    fs.appendFileSync(envPath, `\n# Cron job authentication\nCRON_SECRET=${cronSecret}\n`)
    console.log(`${colors.green}✅ Generated CRON_SECRET${colors.reset}`)
  }
}

console.log(`\n${colors.cyan}${colors.bright}📋 Setup Instructions${colors.reset}`)
console.log('=====================================\n')

console.log('1. Deploy to Netlify:')
console.log(`   ${colors.yellow}git add . && git commit -m "Add scheduled sync"${colors.reset}`)
console.log(`   ${colors.yellow}git push${colors.reset}`)

console.log('\n2. Configure Environment Variables in Netlify:')
console.log('   Go to: Site Settings → Environment Variables')
console.log('   Add the following if not already set:')
console.log('   • CRON_SECRET (from .env.production)')
console.log('   • NEXT_PUBLIC_SITE_URL')
console.log('   • NEXT_PUBLIC_SUPABASE_URL')
console.log('   • SUPABASE_SERVICE_ROLE_KEY')
console.log('   • COURTLISTENER_API_KEY')

console.log('\n3. Verify Scheduled Functions:')
console.log('   Go to: Functions → Scheduled')
console.log('   You should see "scheduled-sync" listed')

console.log('\n4. Monitor Execution:')
console.log('   Functions will run automatically at 2:00 AM PST daily')
console.log('   Check logs at: Functions → scheduled-sync → Logs')

console.log(`\n${colors.cyan}${colors.bright}🚀 Additional Sync Options${colors.reset}`)
console.log('=====================================\n')

console.log('Manual sync commands:')
console.log(`   ${colors.yellow}npm run sync:judges${colors.reset} - Sync judge data`)
console.log(`   ${colors.yellow}npm run sync:courts${colors.reset} - Sync court data`)
console.log(`   ${colors.yellow}npm run sync:decisions${colors.reset} - Sync decision data`)

console.log('\nFull population (first time setup):')
console.log(`   ${colors.yellow}npm run populate:production${colors.reset}`)

console.log('\nCheck data status:')
console.log(`   ${colors.yellow}npm run data:status${colors.reset}`)

console.log(`\n${colors.green}✅ Setup complete!${colors.reset}\n`)