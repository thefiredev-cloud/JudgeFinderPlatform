require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { generateSlug } = require('../lib/utils/slug.ts')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testJudgeUrls() {
  try {
    console.log('🔗 Testing judge URL generation...')
    
    // Get the judges we seeded
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, slug')
      .eq('jurisdiction', 'CA')
      .limit(5)
    
    if (judgesError) {
      throw new Error(`Failed to fetch judges: ${judgesError.message}`)
    }
    
    console.log(`📋 Found ${judges.length} judges with case data:`)
    console.log('')
    
    for (const judge of judges) {
      const generatedSlug = generateSlug(judge.name)
      const dbSlug = judge.slug
      
      console.log(`⚖️  ${judge.name}`)
      console.log(`   ID: ${judge.id}`)
      console.log(`   DB Slug: ${dbSlug || 'None'}`)
      console.log(`   Generated Slug: ${generatedSlug}`)
      console.log(`   URL: http://localhost:3005/judges/${dbSlug || generatedSlug}`)
      console.log(`   Analytics API: http://localhost:3005/api/judges/${judge.id}/analytics`)
      console.log('')
    }
    
    console.log('✅ URLs ready for testing!')
    console.log('💡 Visit any of the URLs above to see the analytics with 100 real cases')
    
  } catch (error) {
    console.error('💥 Error testing URLs:', error.message)
  }
}

testJudgeUrls()