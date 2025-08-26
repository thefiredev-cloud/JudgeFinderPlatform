require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Generate a unique case number
const generateUniqueCase = (judgeId, index) => {
  const caseTypes = ['Civil', 'Criminal', 'Family Law', 'Contract Dispute', 'Personal Injury', 'Business Litigation']
  const caseType = caseTypes[Math.floor(Math.random() * caseTypes.length)]
  
  const outcomes = {
    'Civil': ['Plaintiff verdict', 'Defendant verdict', 'Settlement reached'],
    'Criminal': ['Guilty verdict', 'Not guilty verdict', 'Plea accepted'],
    'Family Law': ['Custody to mother', 'Custody to father', 'Joint custody'],
    'Contract Dispute': ['Contract enforced', 'Contract voided', 'Settlement reached'],
    'Personal Injury': ['Plaintiff awarded damages', 'Defendant verdict', 'Settlement reached'],
    'Business Litigation': ['Plaintiff verdict', 'Defendant verdict', 'Settlement reached']
  }
  
  const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
  const randomName1 = names[Math.floor(Math.random() * names.length)]
  const randomName2 = names[Math.floor(Math.random() * names.length)]
  
  // Generate dates
  const now = new Date()
  const filingDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  const decisionDate = new Date(filingDate.getTime() + Math.random() * 180 * 24 * 60 * 60 * 1000)
  
  // Generate truly unique case number using timestamp and judge ID
  const timestamp = Date.now() + Math.floor(Math.random() * 1000)
  const judgeShort = judgeId.substring(0, 8)
  const caseNumber = `${filingDate.getFullYear().toString().slice(-2)}-CV-${judgeShort}-${timestamp}-${index.toString().padStart(3, '0')}`
  
  const status = Math.random() > 0.8 ? 'pending' : 'decided'
  const outcome = status === 'decided' ? outcomes[caseType][Math.floor(Math.random() * outcomes[caseType].length)] : null
  
  return {
    case_number: caseNumber,
    case_name: `${randomName1} v. ${randomName2}`,
    judge_id: judgeId,
    court_id: null,
    case_type: caseType,
    filing_date: filingDate.toISOString().split('T')[0],
    decision_date: status === 'decided' ? decisionDate.toISOString().split('T')[0] : null,
    status: status,
    outcome: outcome,
    summary: `${caseType} case involving legal dispute`
  }
}

async function testSeedCases() {
  try {
    console.log('🧪 Testing case seeding with a small batch...')
    
    // Get just 3 judges for testing
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, court_id')
      .limit(3)
    
    if (judgesError) {
      throw new Error(`Failed to fetch judges: ${judgesError.message}`)
    }
    
    console.log(`📊 Testing with ${judges.length} judges`)
    
    for (const judge of judges) {
      console.log(`⚖️  Creating 100 test cases for ${judge.name}...`)
      
      const cases = []
      for (let i = 1; i <= 100; i++) {
        cases.push(generateUniqueCase(judge.id, i))
        // Small delay to ensure timestamp uniqueness
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
      
      // Insert cases in smaller batches
      const batchSize = 25
      for (let i = 0; i < cases.length; i += batchSize) {
        const batch = cases.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('cases')
          .insert(batch)
        
        if (insertError) {
          console.error(`❌ Failed to insert batch ${Math.ceil((i + batchSize) / batchSize)} for ${judge.name}:`, insertError.message)
          throw insertError
        }
        
        console.log(`✅ Inserted batch ${Math.ceil((i + batchSize) / batchSize)}/4 for ${judge.name}`)
      }
      
      // Update judge's total_cases count
      await supabase
        .from('judges')
        .update({ total_cases: 100 })
        .eq('id', judge.id)
        
      console.log(`✅ Completed ${judge.name} (100 cases)`)
    }
    
    console.log('🎉 Test seeding completed successfully!')
    
  } catch (error) {
    console.error('💥 Test seeding failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testSeedCases()
  .then(() => {
    console.log('✨ Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  })