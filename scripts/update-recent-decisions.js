/**
 * Incremental Update of Recent Judge Decisions
 * 
 * This script updates recent decisions for judges who already have some case data
 * but may be missing recent opinions. Designed to be run daily/weekly.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Simplified CourtListener client for updates
class CourtListenerClient {
  constructor() {
    this.baseUrl = 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN
    this.requestDelay = 1000
    
    if (!this.apiToken) {
      throw new Error('COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN environment variable is required')
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async makeRequest(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    params.format = 'json'
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    const headers = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.apiToken}`,
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CourtListener API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    await this.sleep(this.requestDelay)
    return data
  }

  async getRecentCasesSince(judgeId, sinceDate) {
    const params = {
      author: judgeId,
      ordering: '-date_created',
      cluster__date_filed__gte: sinceDate,
      page_size: '50'
    }

    const allCases = []
    let offset = 0
    let hasMore = true

    while (hasMore && allCases.length < 100) { // Limit to 100 new cases per judge
      try {
        params.offset = offset.toString()
        console.log(`Making request to: ${this.baseUrl}/opinions/?${new URLSearchParams(params)}`)
        const response = await this.makeRequest('/opinions/', params)
        
        // Fetch cluster details for each opinion
        for (const opinion of response.results) {
          try {
            const cluster = await this.makeRequest(`/clusters/${opinion.cluster_id}/`)
            allCases.push({
              ...cluster,
              opinion_id: opinion.id
            })
          } catch (clusterError) {
            console.error(`    Error fetching cluster ${opinion.cluster_id}:`, clusterError.message)
          }
        }
        
        hasMore = response.next !== null && response.results.length === 50
        offset += 50
        
      } catch (error) {
        console.error(`  Error fetching recent cases:`, error.message)
        break
      }
    }

    return allCases
  }

  transformCaseToRecord(caseCluster, judgeId) {
    return {
      judge_id: judgeId,
      case_name: (caseCluster.case_name || 'Unknown Case').substring(0, 500),
      case_number: `CL-${caseCluster.id}`,
      decision_date: caseCluster.date_filed,
      case_type: 'Opinion',
      status: 'decided',
      outcome: caseCluster.precedential_status || null,
      summary: `CourtListener case cluster ${caseCluster.id}${caseCluster.opinion_id ? ` (opinion ${caseCluster.opinion_id})` : ''}`,
      courtlistener_id: caseCluster.id.toString(),
      filing_date: caseCluster.date_filed
    }
  }
}

async function main() {
  console.log('🔄 Starting Incremental Judge Decisions Update...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  const courtListener = new CourtListenerClient()

  try {
    // Step 1: Find judges with existing cases but potentially stale data
    console.log('\n📊 Finding judges with potentially stale decision data...')
    
    // Get judges who have cases but haven't been updated recently
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30) // Look for judges not updated in 30 days
    
    const { data: candidateJudges, error: queryError } = await supabase
      .from('judges')
      .select(`
        id, 
        name, 
        courtlistener_id,
        jurisdiction
      `)
      .not('courtlistener_id', 'is', null)
      .eq('jurisdiction', 'CA')
      .order('name')
      .limit(50) // Process up to 50 judges per run

    if (queryError) {
      throw new Error(`Database query error: ${queryError.message}`)
    }

    // Get last decision date for each judge
    const { data: lastDecisions, error: decisionError } = await supabase
      .from('cases')
      .select('judge_id, decision_date')
      .not('decision_date', 'is', null)
      .order('decision_date', { ascending: false })

    if (decisionError) {
      throw new Error(`Decision query error: ${decisionError.message}`)
    }

    // Create map of judge ID to last decision date
    const lastDecisionMap = new Map()
    lastDecisions.forEach(case_record => {
      if (!lastDecisionMap.has(case_record.judge_id)) {
        lastDecisionMap.set(case_record.judge_id, case_record.decision_date)
      }
    })

    // Filter judges who need updates (no recent decisions or stale data)
    const judgesNeedingUpdate = candidateJudges
      .filter(judge => judge.courtlistener_id)
      .map(judge => ({
        ...judge,
        last_decision: lastDecisionMap.get(judge.id)
      }))
      .filter(judge => {
        if (!judge.last_decision) return true // No decisions at all
        
        const lastDecisionDate = new Date(judge.last_decision)
        const daysSince = (new Date() - lastDecisionDate) / (1000 * 60 * 60 * 24)
        return daysSince > 7 // Update if last decision is older than 7 days
      })
      .slice(0, 20) // Limit to 20 judges per run

    console.log(`Found ${judgesNeedingUpdate.length} judges needing decision updates`)

    // Step 2: Process each judge
    let processed = 0
    let successful = 0
    let totalCasesAdded = 0

    for (const judge of judgesNeedingUpdate) {
      try {
        console.log(`\n👨‍⚖️ Updating Judge: ${judge.name}`)
        console.log(`   Last decision: ${judge.last_decision || 'None'}`)
        
        // Determine since date (last decision + 1 day, or 30 days ago)
        let sinceDate
        if (judge.last_decision) {
          const lastDate = new Date(judge.last_decision)
          lastDate.setDate(lastDate.getDate() + 1)
          sinceDate = lastDate.toISOString().split('T')[0]
        } else {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          sinceDate = thirtyDaysAgo.toISOString().split('T')[0]
        }
        
        console.log(`   Fetching decisions since: ${sinceDate}`)
        
        // Fetch recent cases
        const recentCases = await courtListener.getRecentCasesSince(judge.courtlistener_id, sinceDate)
        
        if (recentCases.length === 0) {
          console.log(`   ℹ️  No new decisions found`)
          processed++
          continue
        }

        // Transform and filter new cases
        const transformedCases = recentCases.map(caseCluster => 
          courtListener.transformCaseToRecord(caseCluster, judge.id)
        )

        // Check for existing cases
        const clIds = transformedCases.map(c => c.courtlistener_id)
        const { data: existing } = await supabase
          .from('cases')
          .select('courtlistener_id')
          .in('courtlistener_id', clIds)

        const existingIds = existing ? existing.map(c => c.courtlistener_id) : []
        const newCases = transformedCases.filter(c => !existingIds.includes(c.courtlistener_id))

        console.log(`   📄 Found ${newCases.length} new decisions`)

        if (newCases.length > 0) {
          // Insert new cases
          const { data, error } = await supabase
            .from('cases')
            .insert(newCases)

          if (error) {
            console.error(`   ❌ Error inserting cases: ${error.message}`)
          } else {
            console.log(`   ✅ Successfully added ${newCases.length} decisions`)
            totalCasesAdded += newCases.length
            successful++
          }
        }
        
        processed++
        
        // Small delay between judges
        await courtListener.sleep(500)
        
      } catch (error) {
        console.error(`   ❌ Error updating judge ${judge.name}: ${error.message}`)
        processed++
      }
    }

    // Step 3: Summary
    console.log('\n📈 Update Complete!')
    console.log(`   Judges processed: ${processed}`)
    console.log(`   Judges with new data: ${successful}`)
    console.log(`   Total new cases added: ${totalCasesAdded}`)
    
    if (totalCasesAdded > 0) {
      console.log('\n🎉 Successfully updated judge decision data!')
    } else {
      console.log('\n✅ All judges are up to date')
    }

  } catch (error) {
    console.error('❌ Update failed:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error)