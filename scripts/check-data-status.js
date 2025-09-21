#!/usr/bin/env node

/**
 * Check Data Status Script
 * Checks the current status of production data
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

async function checkDataStatus() {
  console.log(`\n${colors.cyan}${colors.bright}📊 JudgeFinder Data Status Check${colors.reset}`)
  console.log('=====================================\n')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(`${colors.red}❌ Missing Supabase credentials in .env.production${colors.reset}`)
    return
  }
  
  try {
    // Check judges
    const { count: judgeCount, error: judgeError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
    
    const { count: caJudgeCount } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
    
    const { count: judgesWithCases } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .gt('total_cases', 0)
    
    // Check courts
    const { count: courtCount, error: courtError } = await supabase
      .from('courts')
      .select('*', { count: 'exact', head: true })
    
    const { count: caCourts } = await supabase
      .from('courts')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
    
    // Check cases
    const { count: caseCount, error: caseError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
    
    const { count: decidedCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'decided')
    
    // Check analytics cache
    const { count: analyticsCount } = await supabase
      .from('judge_analytics_cache')
      .select('*', { count: 'exact', head: true })
    
    // Display results
    console.log(`${colors.blue}${colors.bright}⚖️  Judges${colors.reset}`)
    console.log(`   Total: ${judgeCount || 0}`)
    console.log(`   California: ${caJudgeCount || 0}`)
    console.log(`   With Cases: ${judgesWithCases || 0}`)
    
    console.log(`\n${colors.blue}${colors.bright}🏛️  Courts${colors.reset}`)
    console.log(`   Total: ${courtCount || 0}`)
    console.log(`   California: ${caCourts || 0}`)
    
    console.log(`\n${colors.blue}${colors.bright}📚 Cases${colors.reset}`)
    console.log(`   Total: ${caseCount || 0}`)
    console.log(`   Decided: ${decidedCases || 0}`)
    console.log(`   Pending: ${(caseCount || 0) - (decidedCases || 0)}`)
    
    console.log(`\n${colors.blue}${colors.bright}📈 Analytics${colors.reset}`)
    console.log(`   Cached Profiles: ${analyticsCount || 0}`)
    
    // Check data freshness
    const { data: lastJudge } = await supabase
      .from('judges')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (lastJudge) {
      const lastUpdate = new Date(lastJudge.updated_at)
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`\n${colors.blue}${colors.bright}📅 Data Freshness${colors.reset}`)
      console.log(`   Last Update: ${lastUpdate.toLocaleDateString()}`)
      console.log(`   Days Since Update: ${daysSinceUpdate}`)
      
      if (daysSinceUpdate > 7) {
        console.log(`   ${colors.yellow}⚠️  Data may be stale. Consider running sync.${colors.reset}`)
      } else {
        console.log(`   ${colors.green}✅ Data is fresh${colors.reset}`)
      }
    }
    
    // Overall status
    console.log(`\n${colors.bright}📊 Overall Status${colors.reset}`)
    
    if (!judgeCount && !courtCount) {
      console.log(`   ${colors.red}❌ Database is empty${colors.reset}`)
      console.log(`   ${colors.yellow}→ Run: npm run populate:production${colors.reset}`)
    } else if (judgeCount < 100 || courtCount < 50) {
      console.log(`   ${colors.yellow}⚠️  Database has partial data${colors.reset}`)
      console.log(`   ${colors.yellow}→ Run: npm run sync:judges && npm run sync:courts${colors.reset}`)
    } else {
      console.log(`   ${colors.green}✅ Database is populated${colors.reset}`)
      
      if (!caseCount) {
        console.log(`   ${colors.yellow}→ Consider generating sample cases${colors.reset}`)
      }
      
      if (analyticsCount < judgeCount * 0.5) {
        console.log(`   ${colors.yellow}→ Run: npm run analytics:generate${colors.reset}`)
      }
    }
    
    // Expected targets
    const targetJudges = Number(process.env.TARGET_CA_JUDGES)
    const targetCourts = Number(process.env.TARGET_CA_COURTS)

    if (Number.isFinite(targetJudges) || Number.isFinite(targetCourts)) {
      console.log(`\n${colors.cyan}${colors.bright}🎯 Optional Targets${colors.reset}`)

      if (Number.isFinite(targetJudges)) {
        const judgeProgress = Math.min(100, Math.round(((caJudgeCount || 0) / targetJudges) * 100))
        console.log(`   Judges: ${getProgressBar(judgeProgress)} ${judgeProgress}% (${caJudgeCount || 0}/${targetJudges})`)
      } else {
        console.log('   Judges: (set TARGET_CA_JUDGES to track progress)')
      }

      if (Number.isFinite(targetCourts)) {
        const courtProgress = Math.min(100, Math.round(((caCourts || 0) / targetCourts) * 100))
        console.log(`   Courts: ${getProgressBar(courtProgress)} ${courtProgress}% (${caCourts || 0}/${targetCourts})`)
      } else {
        console.log('   Courts: (set TARGET_CA_COURTS to track progress)')
      }
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Error checking data status:${colors.reset}`, error.message)
    console.error(`\n${colors.yellow}Troubleshooting:${colors.reset}`)
    console.error('1. Check your .env.production file has correct credentials')
    console.error('2. Verify Supabase project is accessible')
    console.error('3. Check network connectivity')
  }
  
  console.log('\n=====================================\n')
}

function getProgressBar(percentage) {
  const width = 20
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled
  
  const filledChar = '█'
  const emptyChar = '░'
  
  const bar = filledChar.repeat(filled) + emptyChar.repeat(empty)
  
  if (percentage >= 100) {
    return `${colors.green}${bar}${colors.reset}`
  } else if (percentage >= 50) {
    return `${colors.yellow}${bar}${colors.reset}`
  } else {
    return `${colors.red}${bar}${colors.reset}`
  }
}

// Run the check
if (require.main === module) {
  checkDataStatus()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { checkDataStatus }
