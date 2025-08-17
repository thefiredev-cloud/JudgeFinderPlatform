/**
 * Test CourtListener Courts Sync Script
 * 
 * Limited version for testing and demonstration purposes.
 * Fetches only the first few pages to test functionality.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class TestCourtListenerSync {
  constructor() {
    this.baseUrl = process.env.COURTLISTENER_BASE_URL || 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🧪 CourtListener Test Sync initialized')
  }

  async makeApiRequest(url) {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.apiToken}`,
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    const fetch = (await import('node-fetch')).default
    const response = await fetch(url, { method: 'GET', headers })

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${await response.text()}`)
    }

    return await response.json()
  }

  async testSync() {
    try {
      console.log('🔍 Testing CourtListener API with first 5 courts...\n')

      // Fetch first page with 5 courts
      const url = `${this.baseUrl}/courts/?format=json&page_size=5`
      const response = await this.makeApiRequest(url)

      console.log(`📊 Total courts available: ${response.count}`)
      console.log(`📥 Fetched: ${response.results.length} courts`)
      console.log(`🔗 Next page URL: ${response.next ? 'Available' : 'None'}\n`)

      // Display sample courts
      response.results.forEach((court, index) => {
        console.log(`${index + 1}. ${court.full_name || court.short_name}`)
        console.log(`   ID: ${court.id}`)
        console.log(`   Jurisdiction: ${court.jurisdiction}`)
        console.log(`   In Use: ${court.in_use}`)
        console.log(`   Citation: ${court.citation_string || 'N/A'}`)
        console.log(`   URL: ${court.url}\n`)
      })

      // Test data mapping for first court
      if (response.results.length > 0) {
        const testCourt = response.results[0]
        console.log('🧪 Testing data mapping for first court...')
        
        const mappedData = this.mapCourtData(testCourt)
        console.log('✅ Mapped data:')
        console.log(`   Name: ${mappedData.name}`)
        console.log(`   Type: ${mappedData.type}`)
        console.log(`   Jurisdiction: ${mappedData.jurisdiction}`)
        console.log(`   CourtListener ID: ${mappedData.courtlistener_id}`)
        console.log(`   Address: ${mappedData.address || 'None'}\n`)

        // Check if court exists in database
        const { data: existingCourt, error } = await this.supabase
          .from('courts')
          .select('id, name, courtlistener_id')
          .eq('courtlistener_id', mappedData.courtlistener_id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.log(`❌ Database check error: ${error.message}`)
        } else if (existingCourt) {
          console.log(`✅ Court exists in database: ${existingCourt.name}`)
        } else {
          console.log(`🆕 Court not found in database - would be created`)
        }
      }

      console.log('\n✅ Test completed successfully!')
      return { success: true, totalAvailable: response.count }

    } catch (error) {
      console.error('❌ Test failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  mapCourtData(courtData) {
    // Same mapping logic as main script
    let jurisdiction = this.normalizeJurisdiction(courtData.jurisdiction)
    let courtType = 'state'
    
    if (courtData.jurisdiction === 'F') {
      courtType = 'federal'
    } else if (this.isLocalCourt(courtData)) {
      courtType = 'local'
    }

    const address = this.buildAddress(courtData)

    return {
      name: courtData.full_name || courtData.short_name || 'Unknown Court',
      type: courtType,
      jurisdiction: jurisdiction,
      address: address,
      courtlistener_id: courtData.id.toString()
    }
  }

  normalizeJurisdiction(clJurisdiction) {
    const map = {
      'F': 'Federal', 'FD': 'Federal', 'FB': 'Federal',
      'C': 'CA', 'CACD': 'CA', 'CAED': 'CA', 'CAND': 'CA', 'CASD': 'CA', 'CA': 'CA'
    }
    return map[clJurisdiction] || clJurisdiction || 'Unknown'
  }

  isLocalCourt(courtData) {
    const indicators = ['municipal', 'city', 'traffic', 'justice', 'magistrate']
    const name = (courtData.full_name || courtData.short_name || '').toLowerCase()
    return indicators.some(indicator => name.includes(indicator))
  }

  buildAddress(courtData) {
    const parts = []
    if (courtData.position) parts.push(`Position: ${courtData.position}`)
    if (courtData.jurisdiction && courtData.jurisdiction !== 'F') {
      const jurisdiction = this.normalizeJurisdiction(courtData.jurisdiction)
      parts.push(jurisdiction === 'CA' ? 'California' : jurisdiction)
    }
    return parts.length > 0 ? parts.join(', ') : null
  }
}

async function main() {
  const tester = new TestCourtListenerSync()
  const result = await tester.testSync()
  
  if (result.success) {
    console.log(`\n🎉 Test passed! ${result.totalAvailable} courts available in CourtListener API`)
  } else {
    console.log('\n💥 Test failed')
  }
}

main().catch(console.error)