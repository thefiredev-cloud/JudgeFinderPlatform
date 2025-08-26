/**
 * Test CourtListener Judges Sync Script
 * 
 * Limited test version that fetches only a small number of judges
 * to verify API connectivity and data mapping before running full sync.
 * 
 * Usage:
 *   node scripts/test-courtlistener-judges-sync.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class CourtListenerJudgesTestService {
  constructor() {
    // Validate required environment variables
    this.validateEnvironment()

    // Initialize API configuration
    this.baseUrl = process.env.COURTLISTENER_BASE_URL || 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🧪 CourtListener Judges Test Service initialized')
    console.log(`📡 API Base URL: ${this.baseUrl}`)
  }

  validateEnvironment() {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'COURTLISTENER_API_KEY'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  /**
   * Test API connectivity and fetch sample data
   */
  async testApiConnectivity() {
    console.log('🔍 Testing CourtListener API connectivity...')

    try {
      // Test basic API access
      const url = `${this.baseUrl}/people/?format=json&page_size=5&has_positions=true`
      const response = await this.makeApiRequest(url)

      console.log(`✅ API connection successful`)
      console.log(`📊 Total people available: ${response.count || 'Unknown'}`)
      console.log(`📥 Fetched: ${response.results?.length || 0} people`)
      console.log(`🔗 Next page URL: ${response.next ? 'Available' : 'None'}`)

      // Fetch position details for the first person to test position API
      if (response.results && response.results.length > 0) {
        const firstPerson = response.results[0]
        if (firstPerson.positions && firstPerson.positions.length > 0) {
          try {
            console.log('\n🔍 Testing position data fetch...')
            const positionUrl = firstPerson.positions[0]
            const positionData = await this.makeApiRequest(positionUrl)
            console.log(`✅ Position API test successful`)
            console.log(`📋 Sample position type: ${positionData.position_type || 'N/A'}`)
            
            // Enhance the response with position details for analysis
            for (const person of response.results) {
              const detailedPositions = []
              for (const posUrl of person.positions || []) {
                try {
                  const posData = await this.makeApiRequest(posUrl)
                  detailedPositions.push(posData)
                  await this.sleep(200) // Small delay between requests
                } catch (error) {
                  console.error(`   ⚠️ Error fetching position: ${error.message}`)
                }
              }
              person.positions = detailedPositions
            }
          } catch (error) {
            console.error(`⚠️ Position API test failed: ${error.message}`)
          }
        }
      }

      return response
    } catch (error) {
      console.error('❌ API connection failed:', error.message)
      throw error
    }
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Make API request with proper headers
   */
  async makeApiRequest(url) {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.apiToken}`,
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    try {
      const fetch = (await import('node-fetch')).default
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: 30000
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error ${response.status}: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond')
      }
      throw error
    }
  }

  /**
   * Test court mappings availability
   */
  async testCourtMappings() {
    console.log('\n🏛️ Testing court mappings...')

    try {
      const { data: courts, error } = await this.supabase
        .from('courts')
        .select('id, name, courtlistener_id')
        .not('courtlistener_id', 'is', null)
        .limit(10)

      if (error) {
        throw new Error(`Failed to load court mappings: ${error.message}`)
      }

      console.log(`✅ Found ${courts.length} courts with CourtListener mappings`)
      
      if (courts.length > 0) {
        console.log('📋 Sample court mappings:')
        courts.slice(0, 3).forEach(court => {
          console.log(`   • ${court.name} (CL ID: ${court.courtlistener_id})`)
        })
      } else {
        console.log('⚠️  No courts with CourtListener IDs found')
        console.log('   Please run court sync script first: sync-courtlistener-courts.js')
      }

      return courts.length
    } catch (error) {
      console.error('❌ Failed to test court mappings:', error.message)
      throw error
    }
  }

  /**
   * Analyze sample judge data
   */
  async analyzeSampleJudges(sampleData) {
    console.log('\n🔍 Analyzing sample judge data...')

    if (!sampleData.results || sampleData.results.length === 0) {
      console.log('⚠️  No sample data to analyze')
      return
    }

    let judgeCount = 0
    let positionCount = 0
    const positionTypes = new Set()
    const allPositionTypes = new Set()
    const educationCount = { with: 0, without: 0 }

    console.log('\n📋 Sample Judge Analysis:')
    console.log('=' .repeat(50))

    // First, let's see what position types we have in the data
    console.log('\n🔍 Analyzing all position types in sample data:')
    for (const person of sampleData.results) {
      if (person.positions && person.positions.length > 0) {
        console.log(`\nPerson ${person.id} positions:`, JSON.stringify(person.positions, null, 2))
        person.positions.forEach(pos => {
          if (pos.position_type) {
            allPositionTypes.add(pos.position_type)
          }
        })
      }
    }
    console.log(`Found position types: ${Array.from(allPositionTypes).join(', ')}`)

    for (const person of sampleData.results.slice(0, 3)) { // Only show first 3 for brevity
      const hasJudgePositions = this.hasJudgePositions(person)
      
      console.log(`\nPerson: ${this.buildFullName(person)}`)
      console.log(`  ID: ${person.id}`)
      console.log(`  Has positions: ${person.positions ? person.positions.length : 0}`)
      if (person.positions && person.positions.length > 0) {
        console.log(`  Position data:`, JSON.stringify(person.positions[0], null, 2))
      }
      console.log(`  Is judge: ${hasJudgePositions}`)
      
      if (hasJudgePositions) {
        judgeCount++
        const fullName = this.buildFullName(person)
        
        console.log(`\n${judgeCount}. ${fullName}`)
        console.log(`   ID: ${person.id}`)
        console.log(`   Slug: ${person.slug || 'N/A'}`)
        console.log(`   DOB: ${person.date_dob || 'N/A'}`)
        console.log(`   Gender: ${person.gender || 'N/A'}`)
        
        // Analyze positions
        if (person.positions && person.positions.length > 0) {
          console.log(`   Positions: ${person.positions.length}`)
          
          person.positions.forEach(pos => {
            if (this.isJudgePosition(pos)) {
              positionCount++
              positionTypes.add(pos.position_type)
              console.log(`     • ${pos.position_type} at Court ${pos.court} (${pos.date_start || 'Unknown start'})`)
            }
          })
        }

        // Analyze education
        if (person.educations && person.educations.length > 0) {
          educationCount.with++
          console.log(`   Education: ${person.educations.length} records`)
          person.educations.slice(0, 2).forEach(edu => {
            console.log(`     • ${edu.school?.name || 'Unknown'} ${edu.degree_year ? `(${edu.degree_year})` : ''}`)
          })
        } else {
          educationCount.without++
          console.log(`   Education: None`)
        }

        // Analyze political affiliations
        if (person.political_affiliations && person.political_affiliations.length > 0) {
          const parties = person.political_affiliations.map(pa => pa.political_party).filter(Boolean)
          console.log(`   Political: ${parties.join(', ')}`)
        }

        // Analyze ABA ratings
        if (person.aba_ratings && person.aba_ratings.length > 0) {
          const ratings = person.aba_ratings.map(r => `${r.rating} (${r.year_rated})`).join(', ')
          console.log(`   ABA Ratings: ${ratings}`)
        }
      }
    }

    console.log('\n📊 Analysis Summary:')
    console.log('=' .repeat(50))
    console.log(`👥 Total people fetched: ${sampleData.results.length}`)
    console.log(`⚖️  People with judge positions: ${judgeCount}`)
    console.log(`📋 Total judge positions: ${positionCount}`)
    console.log(`🎓 Education records: ${educationCount.with} with, ${educationCount.without} without`)
    console.log(`📝 Position types found: ${Array.from(positionTypes).join(', ')}`)

    return {
      totalPeople: sampleData.results.length,
      judges: judgeCount,
      positions: positionCount,
      positionTypes: Array.from(positionTypes),
      education: educationCount
    }
  }

  /**
   * Check if person has judge positions
   */
  hasJudgePositions(person) {
    if (!person.positions || !Array.isArray(person.positions)) {
      return false
    }

    const judgeTypes = [
      'jud', 'c-jud', 's-jud', 'pj', 'aj', 'mag-jud', 
      'ref-jud', 'ret-jud', 'act-jud', 'spec-jud'
    ]

    return person.positions.some(position => 
      position.position_type && judgeTypes.includes(position.position_type)
    )
  }

  /**
   * Check if position is a judge position
   */
  isJudgePosition(position) {
    const judgeTypes = [
      'jud', 'c-jud', 's-jud', 'pj', 'aj', 'mag-jud', 
      'ref-jud', 'ret-jud', 'act-jud', 'spec-jud'
    ]
    return position.position_type && judgeTypes.includes(position.position_type)
  }

  /**
   * Build full name from name components
   */
  buildFullName(personData) {
    const parts = []
    
    if (personData.name_first) parts.push(personData.name_first)
    if (personData.name_middle) parts.push(personData.name_middle)
    if (personData.name_last) parts.push(personData.name_last)
    if (personData.name_suffix) parts.push(personData.name_suffix)

    return parts.join(' ') || 'Unknown Judge'
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnectivity() {
    console.log('\n💾 Testing database connectivity...')

    try {
      // Test judges table
      const { count: judgeCount, error: judgeError } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })

      if (judgeError) {
        throw new Error(`Failed to query judges table: ${judgeError.message}`)
      }

      // Test courts table
      const { count: courtCount, error: courtError } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })

      if (courtError) {
        throw new Error(`Failed to query courts table: ${courtError.message}`)
      }

      console.log(`✅ Database connection successful`)
      console.log(`📊 Current judges: ${judgeCount}`)
      console.log(`🏛️  Current courts: ${courtCount}`)

      return { judgeCount, courtCount }
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      throw error
    }
  }

  /**
   * Run comprehensive test
   */
  async run() {
    try {
      console.log('🧪 Starting CourtListener Judges Sync Test...')
      console.log(`📅 Test time: ${new Date().toISOString()}\n`)

      // Test 1: Database connectivity
      await this.testDatabaseConnectivity()

      // Test 2: Court mappings
      const courtMappingCount = await this.testCourtMappings()

      // Test 3: API connectivity
      const sampleData = await this.testApiConnectivity()

      // Test 4: Data analysis
      const analysis = await this.analyzeSampleJudges(sampleData)

      // Test 5: Readiness assessment
      console.log('\n🎯 Readiness Assessment:')
      console.log('=' .repeat(50))
      
      let ready = true
      const issues = []

      if (courtMappingCount === 0) {
        ready = false
        issues.push('No court mappings available - run court sync first')
      }

      if (!analysis || analysis.judges === 0) {
        ready = false
        issues.push('No judges found in sample data')
      }

      if (ready) {
        console.log('✅ READY: All systems check out!')
        console.log('💡 You can now run the full sync with: node scripts/sync-courtlistener-judges.js')
        console.log(`📊 Expected to sync ${analysis.judges} judges per 5-person API page`)
      } else {
        console.log('❌ NOT READY: Issues found:')
        issues.forEach(issue => console.log(`   • ${issue}`))
      }

      return { ready, issues, analysis }

    } catch (error) {
      console.error('💥 Test failed:', error.message)
      return { ready: false, error: error.message }
    }
  }
}

// Main execution
async function main() {
  try {
    const testService = new CourtListenerJudgesTestService()
    const result = await testService.run()

    if (result.ready) {
      console.log('\n🎉 Test completed successfully!')
      console.log('System is ready for full CourtListener judges sync.')
      process.exit(0)
    } else {
      console.log('\n💥 Test revealed issues that need attention.')
      if (result.error) {
        console.log(`Error: ${result.error}`)
      }
      if (result.issues) {
        console.log('Issues:', result.issues.join(', '))
      }
      process.exit(1)
    }

  } catch (error) {
    console.error('💥 Unhandled test error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the test if called directly
if (require.main === module) {
  main()
}

module.exports = { CourtListenerJudgesTestService }