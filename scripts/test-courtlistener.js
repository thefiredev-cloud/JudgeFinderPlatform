/**
 * Test CourtListener API Integration
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

class SimpleCourtListenerClient {
  constructor() {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN
    
    if (!this.apiToken) {
      throw new Error('COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN environment variable is required')
    }
  }

  async testJudgeOpinions(judgeId, judgeName) {
    console.log(`\n🧪 Testing CourtListener API for Judge: ${judgeName}`)
    console.log(`   CourtListener ID: ${judgeId}`)
    
    const url = new URL(`${this.baseUrl}/clusters/`)
    url.searchParams.append('author', judgeId)
    url.searchParams.append('format', 'json')
    url.searchParams.append('page_size', '5') // Just get 5 for testing
    url.searchParams.append('ordering', '-date_filed')

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.apiToken}`,
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    try {
      console.log(`   Making request to: ${url.toString()}`)
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      console.log(`   ✅ Success! Found cases (count URL: ${data.count})`)
      console.log(`   📄 Returning ${data.results.length} recent cases:`)
      
      data.results.forEach((caseCluster, index) => {
        const caseName = caseCluster.case_name || 'Unknown Case'
        const caseId = caseCluster.id || 'Unknown ID'
        const date = caseCluster.date_filed || 'Unknown Date'
        console.log(`      ${index + 1}. ${caseName} (ID: ${caseId}, Date: ${date})`)
      })
      
      return data
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      throw error
    }
  }
}

async function main() {
  console.log('🔍 Testing CourtListener API Integration...')
  
  const client = new SimpleCourtListenerClient()
  
  // Test with sample judges
  const testJudges = [
    { id: '11580', name: 'Anthony P. Lucaccini' },
    { id: '2026', name: 'Nora Margaret Manella' },
    { id: '12420', name: 'Rolf Michael Treu' }
  ]
  
  for (const judge of testJudges) {
    try {
      await client.testJudgeOpinions(judge.id, judge.name)
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`Failed to test judge ${judge.name}:`, error.message)
    }
  }
  
  console.log('\n✅ CourtListener API test complete!')
}

main().catch(console.error)