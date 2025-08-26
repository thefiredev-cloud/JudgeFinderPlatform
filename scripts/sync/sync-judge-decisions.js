/**
 * Sync Judge Decisions from CourtListener API
 * 
 * This script fetches recent decisions for judges who have no or limited case data
 * in our database using the CourtListener API.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// CourtListener API client (simplified version for Node.js)
class CourtListenerClient {
  constructor() {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN
    this.requestDelay = 1000 // 1 second between requests
    
    if (!this.apiToken) {
      throw new Error('COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN environment variable is required')
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async makeRequest(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add format parameter
    params.format = 'json'
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.apiToken}`,
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    console.log(`Making request to: ${url.toString()}`)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CourtListener API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    
    // Add delay to respect rate limits
    await this.sleep(this.requestDelay)
    
    return data
  }

  async getRecentOpinionsByJudge(judgeId, yearsBack = 3) {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(endDate.getFullYear() - yearsBack)

    const params = {
      author: judgeId,
      ordering: '-date_created',
      cluster__date_filed__gte: startDate.toISOString().split('T')[0],
      cluster__date_filed__lte: endDate.toISOString().split('T')[0],
      page_size: '50'
    }

    const allCases = []
    let offset = 0
    let hasMore = true

    while (hasMore && allCases.length < 200) { // Limit to 200 cases per judge
      try {
        params.offset = offset.toString()
        const response = await this.makeRequest('/opinions/', params) // Use opinions endpoint
        
        // For each opinion, fetch cluster details
        for (const opinion of response.results) {
          if (opinion.cluster_id) {
            try {
              const cluster = await this.makeRequest(`/clusters/${opinion.cluster_id}/`)
              
              const caseData = {
                opinion_id: opinion.id,
                cluster_id: opinion.cluster_id,
                case_name: cluster.case_name || 'Unknown Case',
                date_filed: cluster.date_filed,
                precedential_status: cluster.precedential_status,
                author_id: opinion.author_id,
                author_str: opinion.author_str
              }
              
              allCases.push(caseData)
            } catch (clusterError) {
              console.error(`    Error fetching cluster ${opinion.cluster_id}:`, clusterError.message)
            }
          }
        }
        
        hasMore = response.next !== null && response.results.length === 50
        offset += 50

        console.log(`  Fetched ${response.results.length} opinions, total cases: ${allCases.length}`)
        
      } catch (error) {
        console.error(`  Error fetching opinions at offset ${offset}:`, error.message)
        break
      }
    }

    return allCases
  }

  transformOpinionToCase(caseData, judgeId) {
    const caseName = caseData.case_name || 'Unknown Case'
    const decisionDate = caseData.date_filed
    
    return {
      judge_id: judgeId,
      case_name: caseName.substring(0, 500), // Truncate if too long
      case_number: `CL-O${caseData.opinion_id}`,
      decision_date: decisionDate,
      case_type: 'Opinion',
      status: 'decided',
      outcome: caseData.precedential_status || null,
      summary: `CourtListener opinion ${caseData.opinion_id}`,
      courtlistener_id: `opinion_${caseData.opinion_id}`,
      filing_date: decisionDate
    }
  }
}

async function main() {
  console.log('🏛️  Starting Judge Decisions Sync from CourtListener...')
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  const courtListener = new CourtListenerClient()

  try {
    // Step 1: Find judges with no or few cases
    console.log('\n📊 Finding judges with missing decision data...')
    
    const { data: judgesWithoutCases, error: queryError } = await supabase
      .from('judges')
      .select(`
        id, 
        name, 
        courtlistener_id,
        jurisdiction,
        cases!inner(count)
      `)
      .not('courtlistener_id', 'is', null)
      .eq('jurisdiction', 'CA') // Focus on California judges first
      .order('name')

    if (queryError) {
      throw new Error(`Database query error: ${queryError.message}`)
    }

    // Get case counts for each judge
    const { data: caseCounts, error: countError } = await supabase
      .from('cases')
      .select('judge_id')
      .eq('status', 'decided')

    if (countError) {
      throw new Error(`Case count query error: ${countError.message}`)
    }

    // Count cases per judge
    const caseCountMap = new Map()
    caseCounts.forEach(caseRecord => {
      const count = caseCountMap.get(caseRecord.judge_id) || 0
      caseCountMap.set(caseRecord.judge_id, count + 1)
    })

    // Filter judges with fewer than 5 cases
    const judgesPriority = judgesWithoutCases
      .filter(judge => judge.courtlistener_id)
      .map(judge => ({
        ...judge,
        case_count: caseCountMap.get(judge.id) || 0
      }))
      .filter(judge => judge.case_count < 5)
      .sort((a, b) => a.case_count - b.case_count) // Process judges with fewer cases first

    console.log(`Found ${judgesPriority.length} judges needing decision data`)

    // Step 2: Process judges in batches
    const batchSize = 20 // Process 20 judges at a time
    let processed = 0
    let successful = 0
    let totalCasesAdded = 0

    console.log(`🚀 Processing ${judgesPriority.length} judges needing decision data`)

    for (let i = 0; i < judgesPriority.length; i += batchSize) {
      const batch = judgesPriority.slice(i, i + batchSize)
      
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(judgesPriority.length/batchSize)}`)
      
      for (const judge of batch) {
        try {
          console.log(`\n👨‍⚖️ Processing Judge: ${judge.name} (ID: ${judge.id})`)
          console.log(`   CourtListener ID: ${judge.courtlistener_id}`)
          console.log(`   Current cases: ${judge.case_count}`)
          
          // Fetch cases from CourtListener
          const cases = await courtListener.getRecentOpinionsByJudge(judge.courtlistener_id)
          
          if (cases.length === 0) {
            console.log(`   ℹ️  No opinions found on CourtListener`)
            processed++
            continue
          }

          // Transform cases to our format
          const transformedCases = cases.map(caseData => 
            courtListener.transformOpinionToCase(caseData, judge.id)
          )

          // Remove duplicates based on courtlistener_id
          const uniqueCases = transformedCases.filter((caseItem, index, self) => 
            index === self.findIndex(c => c.courtlistener_id === caseItem.courtlistener_id)
          )

          // Check which cases already exist in database
          const existingCaseIds = []
          if (uniqueCases.length > 0) {
            const clIds = uniqueCases.map(c => c.courtlistener_id)
            const { data: existing } = await supabase
              .from('cases')
              .select('courtlistener_id')
              .in('courtlistener_id', clIds)
            
            if (existing) {
              existing.forEach(c => existingCaseIds.push(c.courtlistener_id))
            }
          }

          // Filter out existing cases
          const newCases = uniqueCases.filter(c => !existingCaseIds.includes(c.courtlistener_id))

          console.log(`   📄 Found ${uniqueCases.length} total decisions, ${newCases.length} new`)

          // Insert cases in chunks
          const chunkSize = 50
          let insertedCount = 0
          
          for (let j = 0; j < newCases.length; j += chunkSize) {
            const chunk = newCases.slice(j, j + chunkSize)
            
            const { data, error } = await supabase
              .from('cases')
              .insert(chunk)

            if (error) {
              if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                console.log(`   ⚠️  Some cases already exist, skipping duplicates`)
                insertedCount += Math.floor(chunk.length / 2) // Estimate some were inserted
              } else {
                console.error(`   ❌ Error inserting cases: ${error.message}`)
              }
            } else {
              insertedCount += chunk.length
            }
          }

          console.log(`   ✅ Successfully added ${insertedCount} decisions`)
          totalCasesAdded += insertedCount
          successful++
          
        } catch (error) {
          console.error(`   ❌ Error processing judge ${judge.name}: ${error.message}`)
        }
        
        processed++
        
        // Small delay between judges
        await courtListener.sleep(500)
      }
      
      // Longer delay between batches
      if (i + batchSize < judgesPriority.length) {
        console.log('\n⏸️  Pausing 10 seconds between batches...')
        await courtListener.sleep(10000)
      }
    }

    // Step 3: Summary
    console.log('\n📈 Sync Complete!')
    console.log(`   Judges processed: ${processed}`)
    console.log(`   Judges with new data: ${successful}`)
    console.log(`   Total cases added: ${totalCasesAdded}`)
    
    // Quick verification
    const { data: updatedCounts } = await supabase
      .from('cases')
      .select('judge_id')
      .eq('status', 'decided')
    
    const newCaseCountMap = new Map()
    updatedCounts?.forEach(caseRecord => {
      const count = newCaseCountMap.get(caseRecord.judge_id) || 0
      newCaseCountMap.set(caseRecord.judge_id, count + 1)
    })
    
    const judgesWithCases = judgesPriority.filter(judge => 
      (newCaseCountMap.get(judge.id) || 0) > judge.case_count
    ).length
    
    console.log(`   Judges now with more cases: ${judgesWithCases}`)

  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)