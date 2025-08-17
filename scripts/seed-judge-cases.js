require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Case types and their typical outcomes
const CASE_TYPES = {
  'Civil': {
    weight: 25,
    outcomes: [
      'Plaintiff verdict',
      'Defendant verdict', 
      'Plaintiff verdict',
      'Settlement reached',
      'Dismissed with prejudice',
      'Dismissed without prejudice',
      'Summary judgment for plaintiff',
      'Summary judgment for defendant'
    ]
  },
  'Criminal': {
    weight: 20,
    outcomes: [
      'Guilty verdict',
      'Not guilty verdict',
      'Plea accepted',
      'Plea rejected',
      'Sentenced to 2 years probation',
      'Sentenced to 6 months prison',
      'Sentenced to 1 year prison',
      'Sentenced to 3 years prison',
      'Case dismissed',
      'Plea bargain accepted'
    ]
  },
  'Family Law': {
    weight: 20,
    outcomes: [
      'Custody to mother',
      'Custody to father',
      'Joint custody awarded',
      'Alimony awarded',
      'Alimony denied',
      'Divorce granted',
      'Child support ordered',
      'Visitation rights granted',
      'Property division ordered'
    ]
  },
  'Contract Dispute': {
    weight: 15,
    outcomes: [
      'Contract enforced',
      'Contract voided',
      'Breach found',
      'No breach found',
      'Damages awarded',
      'Case dismissed',
      'Settlement reached',
      'Specific performance ordered'
    ]
  },
  'Personal Injury': {
    weight: 10,
    outcomes: [
      'Plaintiff awarded damages',
      'Defendant verdict',
      'Settlement reached',
      'Comparative negligence found',
      'No liability found',
      'Damages reduced',
      'Case dismissed'
    ]
  },
  'Business Litigation': {
    weight: 10,
    outcomes: [
      'Plaintiff verdict',
      'Defendant verdict',
      'Settlement reached',
      'Injunction granted',
      'Injunction denied',
      'Partnership dissolved',
      'Contract terminated',
      'Damages awarded'
    ]
  }
}

// Generate case names based on type
const generateCaseName = (caseType, caseNumber) => {
  const names = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
  ]
  
  const companies = [
    'Tech Solutions Inc', 'Global Industries', 'Pacific Corp', 'Metro Holdings',
    'California Enterprises', 'Newport Companies', 'Orange County LLC', 'Vista Group',
    'Coastal Partners', 'Harbor Investments', 'Bay Area Corp', 'Central Valley Inc'
  ]

  const getRandomName = () => names[Math.floor(Math.random() * names.length)]
  const getRandomCompany = () => companies[Math.floor(Math.random() * companies.length)]

  switch (caseType) {
    case 'Civil':
      return `${getRandomName()} v. ${Math.random() > 0.5 ? getRandomName() : getRandomCompany()}`
    
    case 'Criminal':
      return `People of California v. ${getRandomName()}`
    
    case 'Family Law':
      return `In re Marriage of ${getRandomName()}`
    
    case 'Contract Dispute':
      return `${getRandomCompany()} v. ${Math.random() > 0.5 ? getRandomCompany() : getRandomName()}`
    
    case 'Personal Injury':
      return `${getRandomName()} v. ${getRandomCompany()}`
    
    case 'Business Litigation':
      return `${getRandomCompany()} v. ${getRandomCompany()}`
    
    default:
      return `${getRandomName()} v. ${getRandomName()}`
  }
}

// Generate realistic case number
const generateCaseNumber = (year, index, judgeId) => {
  const prefixes = ['CV', 'CR', 'FL', 'BC', 'PI', 'BL']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const formattedIndex = String(index).padStart(5, '0')
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp for uniqueness
  const judgeHash = judgeId.substring(0, 4) // Use first 4 chars of judge UUID
  return `${year.toString().slice(-2)}-${prefix}-${judgeHash}-${timestamp}-${formattedIndex}`
}

// Generate random date within the last 3 years (since 2022)
const generateRandomDate = (startDaysAgo = 1095, endDaysAgo = 0) => { // 3 years = 1095 days
  const now = new Date()
  const start = new Date(now.getTime() - (startDaysAgo * 24 * 60 * 60 * 1000))
  const end = new Date(now.getTime() - (endDaysAgo * 24 * 60 * 60 * 1000))
  
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime())
  return new Date(randomTime).toISOString().split('T')[0]
}

// Generate date within specific year for better distribution
const generateDateInYear = (year) => {
  const start = new Date(year, 0, 1) // January 1st
  const end = new Date(year, 11, 31) // December 31st
  
  // Reduce cases in summer (July-August) and winter holidays (December)
  let month = Math.floor(Math.random() * 12)
  if ((month === 6 || month === 7) && Math.random() < 0.3) { // 30% fewer summer cases
    month = Math.floor(Math.random() * 10) // Choose from other months
  }
  if (month === 11 && Math.random() < 0.4) { // 40% fewer December cases
    month = Math.floor(Math.random() * 11) // Choose from other months
  }
  
  const day = Math.floor(Math.random() * 28) + 1 // Safe day range for all months
  const date = new Date(year, month, day)
  
  return date.toISOString().split('T')[0]
}

// Generate case summary
const generateCaseSummary = (caseType, outcome) => {
  const summaries = {
    'Civil': [
      'Contract dispute over service delivery terms and payment obligations',
      'Personal injury claim resulting from automobile accident',
      'Property damage dispute between neighboring landowners',
      'Employment discrimination claim filed by former employee',
      'Breach of warranty claim for defective manufacturing equipment'
    ],
    'Criminal': [
      'Defendant charged with DUI and reckless driving',
      'Theft charges involving stolen merchandise from retail store',
      'Assault charges from altercation at local establishment',
      'Drug possession charges with intent to distribute',
      'Fraud charges related to financial misrepresentation'
    ],
    'Family Law': [
      'Divorce proceedings with child custody and support issues',
      'Modification of existing child support order',
      'Domestic violence restraining order petition',
      'Paternity determination and custody arrangement',
      'Division of marital property and assets'
    ],
    'Contract Dispute': [
      'Breach of service agreement and failure to perform',
      'Construction contract dispute over project completion',
      'Software licensing agreement violation',
      'Vendor contract termination and damages claim',
      'Real estate purchase agreement dispute'
    ],
    'Personal Injury': [
      'Slip and fall accident at commercial property',
      'Medical malpractice claim for surgical complications',
      'Product liability claim for defective consumer goods',
      'Workplace injury compensation claim',
      'Motor vehicle accident with serious injuries'
    ],
    'Business Litigation': [
      'Partnership dissolution and asset distribution',
      'Trade secret misappropriation claim',
      'Shareholder dispute over corporate governance',
      'Breach of non-compete agreement',
      'Intellectual property infringement claim'
    ]
  }
  
  const typeSummaries = summaries[caseType] || summaries['Civil']
  return typeSummaries[Math.floor(Math.random() * typeSummaries.length)]
}

// Select case type based on weights
const selectCaseType = () => {
  const totalWeight = Object.values(CASE_TYPES).reduce((sum, type) => sum + type.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const [type, config] of Object.entries(CASE_TYPES)) {
    random -= config.weight
    if (random <= 0) return type
  }
  
  return 'Civil' // fallback
}

// Generate a single case for specific year
const generateCase = (judgeId, courtId, index, year = null) => {
  const caseType = selectCaseType()
  
  // Use specific year or generate for last 3 years
  const filingYear = year || (2022 + Math.floor(Math.random() * 4)) // 2022-2025
  const filingDate = generateDateInYear(filingYear)
  
  // 75% decided, 15% settled, 10% pending (more realistic for 3-year data)
  const statusRandom = Math.random()
  let status, decisionDate, outcome
  
  if (statusRandom < 0.75) {
    status = 'decided'
    // Decision date should be after filing date, within reasonable timeframe
    const filingTime = new Date(filingDate).getTime()
    const maxDecisionDelay = 365 * 24 * 60 * 60 * 1000 // Up to 1 year after filing
    const decisionTime = filingTime + (Math.random() * maxDecisionDelay)
    const maxTime = Math.min(decisionTime, Date.now()) // Can't be in future
    decisionDate = new Date(maxTime).toISOString().split('T')[0]
    outcome = CASE_TYPES[caseType].outcomes[Math.floor(Math.random() * CASE_TYPES[caseType].outcomes.length)]
  } else if (statusRandom < 0.9) {
    status = 'settled'
    // Settlement typically happens faster than court decision
    const filingTime = new Date(filingDate).getTime()
    const maxSettlementDelay = 180 * 24 * 60 * 60 * 1000 // Up to 6 months after filing
    const settlementTime = filingTime + (Math.random() * maxSettlementDelay)
    const maxTime = Math.min(settlementTime, Date.now()) // Can't be in future
    decisionDate = new Date(maxTime).toISOString().split('T')[0]
    outcome = 'Settlement reached'
  } else {
    status = 'pending'
    decisionDate = null
    outcome = null
  }
  
  const caseNumber = generateCaseNumber(filingYear, index, judgeId)
  const caseName = generateCaseName(caseType, caseNumber)
  const summary = generateCaseSummary(caseType, outcome)
  
  return {
    case_number: caseNumber,
    case_name: caseName,
    judge_id: judgeId,
    court_id: courtId,
    case_type: caseType,
    filing_date: filingDate,
    decision_date: decisionDate,
    status: status,
    outcome: outcome,
    summary: summary
  }
}

// Main seeding function
async function seedJudgeCases() {
  try {
    console.log('🌱 Starting case seeding process...')
    
    // Get all California judges only
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, court_id')
      .eq('jurisdiction', 'CA')
      .limit(1000)
    
    if (judgesError) {
      throw new Error(`Failed to fetch judges: ${judgesError.message}`)
    }
    
    console.log(`📊 Found ${judges.length} judges to seed with cases`)
    
    // Clear existing cases first (optional - remove if you want to keep existing data)
    console.log('🗑️  Clearing existing cases...')
    const { error: deleteError } = await supabase
      .from('cases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (deleteError) {
      console.warn('Warning: Could not clear existing cases:', deleteError.message)
    }
    
    let totalCasesCreated = 0
    
    // Generate cases for last 3 years: 2022, 2023, 2024, 2025
    const casesPerYearPerJudge = 75 // 75 cases per year = 300 total per judge
    const years = [2022, 2023, 2024, 2025]
    
    // Process judges in batches to avoid overwhelming the database
    const batchSize = 3 // Reduced batch size due to increased data volume
    for (let i = 0; i < judges.length; i += batchSize) {
      const judgeBatch = judges.slice(i, i + batchSize)
      
      for (const judge of judgeBatch) {
        const totalCasesForJudge = casesPerYearPerJudge * years.length
        console.log(`⚖️  Generating ${totalCasesForJudge} cases across ${years.length} years for ${judge.name}...`)
        
        const allCases = []
        let caseIndex = 1
        
        // Generate cases for each year
        for (const year of years) {
          console.log(`   📅 Year ${year}: ${casesPerYearPerJudge} cases`)
          for (let j = 1; j <= casesPerYearPerJudge; j++) {
            allCases.push(generateCase(judge.id, judge.court_id, caseIndex, year))
            caseIndex++
          }
        }
        
        // Insert cases for this judge
        const { error: insertError } = await supabase
          .from('cases')
          .insert(allCases)
        
        if (insertError) {
          console.error(`❌ Failed to insert cases for ${judge.name}:`, insertError.message)
          continue
        }
        
        totalCasesCreated += allCases.length
        
        // Update judge's total_cases count
        await supabase
          .from('judges')
          .update({ total_cases: totalCasesForJudge })
          .eq('id', judge.id)
      }
      
      console.log(`✅ Completed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(judges.length / batchSize)}`)
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`🎉 Case seeding completed successfully!`)
    console.log(`📈 Total cases created: ${totalCasesCreated}`)
    console.log(`⚖️  Judges processed: ${judges.length}`)
    console.log(`📊 Average cases per judge: ${Math.round(totalCasesCreated / judges.length)}`)
    
    // Clear analytics cache to force regeneration
    console.log('🗑️  Clearing analytics cache...')
    const { error: cacheError } = await supabase
      .from('judge_analytics_cache')
      .delete()
      .neq('judge_id', '00000000-0000-0000-0000-000000000000') // Delete all cache
    
    if (cacheError) {
      console.warn('Warning: Could not clear analytics cache:', cacheError.message)
    } else {
      console.log('✅ Analytics cache cleared successfully')
    }
    
    // Verify data
    const { data: caseCount } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
    
    console.log(`🔍 Verification: ${caseCount?.length || 'Unknown'} total cases in database`)
    
  } catch (error) {
    console.error('💥 Error during case seeding:', error.message)
    process.exit(1)
  }
}

// Run the seeding process
if (require.main === module) {
  seedJudgeCases()
    .then(() => {
      console.log('✨ Case seeding process completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Case seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedJudgeCases, generateCase, CASE_TYPES }