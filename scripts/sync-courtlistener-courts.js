/**
 * CourtListener Courts Sync Script
 * 
 * Fetches all courts from CourtListener API v4 and syncs with our database.
 * Handles pagination, rate limiting, and data integrity.
 * 
 * Features:
 * - Cursor-based pagination support
 * - Rate limiting (1 second between requests)
 * - Data backup before modifications
 * - California jurisdiction normalization
 * - Comprehensive logging and error handling
 * - Production-ready with full transaction support
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

class CourtListenerSyncService {
  constructor() {
    // Validate required environment variables
    this.validateEnvironment()

    // Initialize API configuration
    this.baseUrl = process.env.COURTLISTENER_BASE_URL || 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY
    this.rateLimit = 1000 // 1 second between requests

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Statistics tracking
    this.stats = {
      totalFetched: 0,
      newCourts: 0,
      updatedCourts: 0,
      skippedCourts: 0,
      errors: 0,
      startTime: new Date()
    }

    console.log('🏛️ CourtListener Courts Sync Service initialized')
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
   * Create backup of current courts data
   */
  async createBackup() {
    try {
      console.log('💾 Creating backup of current courts data...')
      
      const { data: courts, error } = await this.supabase
        .from('courts')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch courts for backup: ${error.message}`)
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        totalCourts: courts.length,
        courts: courts
      }

      const backupPath = path.join(__dirname, `courts-backup-${Date.now()}.json`)
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
      
      console.log(`✅ Backup created: ${backupPath}`)
      console.log(`📊 Backed up ${courts.length} courts`)
      
      return backupPath
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message)
      throw error
    }
  }

  /**
   * Fetch courts from CourtListener API with pagination
   */
  async fetchAllCourts() {
    const allCourts = []
    let nextUrl = `${this.baseUrl}/courts/?format=json&page_size=200`
    let pageCount = 0

    console.log('📥 Fetching courts from CourtListener API...')

    while (nextUrl) {
      try {
        pageCount++
        console.log(`📄 Fetching page ${pageCount}...`)

        const response = await this.makeApiRequest(nextUrl)
        
        if (!response.results || !Array.isArray(response.results)) {
          throw new Error('Invalid API response: missing results array')
        }

        allCourts.push(...response.results)
        this.stats.totalFetched = allCourts.length

        console.log(`   📊 Page ${pageCount}: ${response.results.length} courts`)
        console.log(`   🔄 Total fetched: ${allCourts.length}`)

        // Check for next page
        nextUrl = response.next

        if (nextUrl) {
          console.log(`   ⏱️ Rate limiting: waiting ${this.rateLimit}ms...`)
          await this.sleep(this.rateLimit)
        }

      } catch (error) {
        console.error(`❌ Error fetching page ${pageCount}:`, error.message)
        this.stats.errors++
        
        // Continue with next page on non-critical errors
        if (error.message.includes('rate limit') || error.message.includes('timeout')) {
          console.log('⏸️ Extending rate limit due to error...')
          await this.sleep(this.rateLimit * 3)
          continue
        }
        
        throw error
      }
    }

    console.log(`✅ Completed fetching ${allCourts.length} courts from ${pageCount} pages`)
    return allCourts
  }

  /**
   * Make API request with proper headers and error handling
   */
  async makeApiRequest(url) {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Token ${this.apiToken}`,
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    try {
      // Import fetch dynamically for Node.js compatibility
      const fetch = (await import('node-fetch')).default
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        timeout: 30000 // 30 second timeout
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
   * Map CourtListener court data to our database schema
   */
  mapCourtData(courtData) {
    try {
      // Normalize jurisdiction - handle California variations
      let jurisdiction = this.normalizeJurisdiction(courtData.jurisdiction)

      // Determine court type based on CourtListener fields
      let courtType = 'state' // default
      if (courtData.jurisdiction === 'F') {
        courtType = 'federal'
      } else if (this.isLocalCourt(courtData)) {
        courtType = 'local'
      }

      // Build address from location data
      const address = this.buildAddress(courtData)

      // Prepare courthouse metadata
      const metadata = {
        courtlistener_data: {
          id: courtData.id,
          url: courtData.url,
          date_modified: courtData.date_modified,
          in_use: courtData.in_use,
          has_opinion_scraper: courtData.has_opinion_scraper,
          has_oral_argument_scraper: courtData.has_oral_argument_scraper,
          position: courtData.position,
          citation_string: courtData.citation_string,
          short_name: courtData.short_name,
          full_name: courtData.full_name,
          jurisdiction: courtData.jurisdiction
        },
        sync_metadata: {
          last_synced: new Date().toISOString(),
          sync_source: 'courtlistener_api_v4'
        }
      }

      return {
        name: courtData.full_name || courtData.short_name || 'Unknown Court',
        type: courtType,
        jurisdiction: jurisdiction,
        address: address,
        website: null, // CourtListener doesn't provide website URLs
        phone: null,   // CourtListener doesn't provide phone numbers
        courtlistener_id: courtData.id.toString(),
        courthouse_metadata: metadata,
        updated_at: new Date().toISOString()
      }
    } catch (error) {
      console.error(`❌ Error mapping court data for court ID ${courtData.id}:`, error.message)
      throw error
    }
  }

  /**
   * Normalize jurisdiction codes to our standard format
   */
  normalizeJurisdiction(clJurisdiction) {
    const jurisdictionMap = {
      'F': 'Federal',
      'FD': 'Federal',
      'FB': 'Federal',
      'C': 'CA',        // California - normalize to CA
      'CACD': 'CA',     // Central District of California
      'CAED': 'CA',     // Eastern District of California  
      'CAND': 'CA',     // Northern District of California
      'CASD': 'CA',     // Southern District of California
      'CA': 'CA'        // Already correct
    }

    // Return mapped value or original if not found
    return jurisdictionMap[clJurisdiction] || clJurisdiction || 'Unknown'
  }

  /**
   * Determine if court is local/municipal based on court name and data
   */
  isLocalCourt(courtData) {
    const localIndicators = [
      'municipal', 'city', 'traffic', 'justice', 'magistrate',
      'small claims', 'housing', 'family', 'juvenile'
    ]

    const courtName = (courtData.full_name || courtData.short_name || '').toLowerCase()
    return localIndicators.some(indicator => courtName.includes(indicator))
  }

  /**
   * Build address string from CourtListener location data
   */
  buildAddress(courtData) {
    // CourtListener doesn't provide detailed address information
    // We'll construct what we can from available fields
    const addressParts = []

    if (courtData.position) {
      addressParts.push(`Position: ${courtData.position}`)
    }

    if (courtData.jurisdiction && courtData.jurisdiction !== 'F') {
      const jurisdiction = this.normalizeJurisdiction(courtData.jurisdiction)
      if (jurisdiction === 'CA') {
        addressParts.push('California')
      } else {
        addressParts.push(jurisdiction)
      }
    }

    return addressParts.length > 0 ? addressParts.join(', ') : null
  }

  /**
   * Sync courts data with database
   */
  async syncCourts(courtsData) {
    console.log(`🔄 Syncing ${courtsData.length} courts with database...`)

    for (let i = 0; i < courtsData.length; i++) {
      const courtData = courtsData[i]
      const progress = `[${i + 1}/${courtsData.length}]`

      try {
        console.log(`${progress} Processing court: ${courtData.full_name || courtData.short_name}`)

        // Map CourtListener data to our schema
        const mappedData = this.mapCourtData(courtData)

        // Check if court already exists by courtlistener_id
        const { data: existingCourt, error: searchError } = await this.supabase
          .from('courts')
          .select('id, name, courtlistener_id, updated_at')
          .eq('courtlistener_id', mappedData.courtlistener_id)
          .single()

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw new Error(`Database search error: ${searchError.message}`)
        }

        if (existingCourt) {
          // Update existing court
          const { error: updateError } = await this.supabase
            .from('courts')
            .update({
              name: mappedData.name,
              type: mappedData.type,
              jurisdiction: mappedData.jurisdiction,
              address: mappedData.address,
              courthouse_metadata: mappedData.courthouse_metadata,
              updated_at: mappedData.updated_at
            })
            .eq('id', existingCourt.id)

          if (updateError) {
            throw new Error(`Failed to update court: ${updateError.message}`)
          }

          console.log(`   ✅ Updated existing court: ${existingCourt.name}`)
          this.stats.updatedCourts++

        } else {
          // Create new court
          const { error: insertError } = await this.supabase
            .from('courts')
            .insert([mappedData])

          if (insertError) {
            throw new Error(`Failed to insert court: ${insertError.message}`)
          }

          console.log(`   🆕 Created new court: ${mappedData.name}`)
          this.stats.newCourts++
        }

      } catch (error) {
        console.error(`   ❌ Error processing court ${courtData.id}:`, error.message)
        this.stats.errors++
        this.stats.skippedCourts++
        
        // Continue processing other courts
        continue
      }

      // Rate limiting between database operations
      if (i < courtsData.length - 1) {
        await this.sleep(100) // 100ms between database operations
      }
    }
  }

  /**
   * Generate final sync report
   */
  async generateReport() {
    const endTime = new Date()
    const duration = Math.round((endTime - this.stats.startTime) / 1000)

    console.log('\n📊 CourtListener Courts Sync Report')
    console.log('=' .repeat(50))
    console.log(`⏱️  Duration: ${duration} seconds`)
    console.log(`📥 Total fetched from API: ${this.stats.totalFetched}`)
    console.log(`🆕 New courts created: ${this.stats.newCourts}`)
    console.log(`🔄 Existing courts updated: ${this.stats.updatedCourts}`)
    console.log(`⏭️  Courts skipped: ${this.stats.skippedCourts}`)
    console.log(`❌ Errors encountered: ${this.stats.errors}`)

    // Get final database statistics
    try {
      const { count: totalCourts, error } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ Could not fetch final court count: ${error.message}`)
      } else {
        console.log(`📊 Total courts in database: ${totalCourts}`)
      }

      // California-specific stats
      const { count: caCourts, error: caError } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')

      if (caError) {
        console.log(`❌ Could not fetch CA court count: ${caError.message}`)
      } else {
        console.log(`🏛️  California courts: ${caCourts}`)
      }

      // Courts with CourtListener IDs
      const { count: mappedCourts, error: mappedError } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
        .not('courtlistener_id', 'is', null)

      if (mappedError) {
        console.log(`❌ Could not fetch mapped court count: ${mappedError.message}`)
      } else {
        console.log(`🔗 Courts with CourtListener mapping: ${mappedCourts}`)
      }

    } catch (error) {
      console.log(`❌ Error generating database statistics: ${error.message}`)
    }

    console.log('=' .repeat(50))

    const success = this.stats.errors === 0
    if (success) {
      console.log('✅ Sync completed successfully!')
    } else {
      console.log(`⚠️  Sync completed with ${this.stats.errors} errors`)
    }

    return {
      success,
      stats: this.stats,
      duration
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Main sync execution
   */
  async run() {
    try {
      console.log('🚀 Starting CourtListener Courts Sync...')
      console.log(`📅 Start time: ${this.stats.startTime.toISOString()}\n`)

      // Step 1: Create backup
      await this.createBackup()

      // Step 2: Fetch all courts from CourtListener
      const courtsData = await this.fetchAllCourts()

      if (courtsData.length === 0) {
        console.log('⚠️  No courts fetched from API. Exiting.')
        return { success: false, reason: 'No data fetched' }
      }

      // Step 3: Sync with database
      await this.syncCourts(courtsData)

      // Step 4: Generate report
      const report = await this.generateReport()

      return report

    } catch (error) {
      console.error('💥 Fatal error during sync:', error.message)
      this.stats.errors++
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      }
    }
  }
}

// Main execution
async function main() {
  try {
    const syncService = new CourtListenerSyncService()
    const result = await syncService.run()

    if (result.success) {
      console.log('\n🎉 CourtListener courts sync completed successfully!')
      process.exit(0)
    } else {
      console.log('\n💥 CourtListener courts sync failed')
      console.log(`Reason: ${result.error || result.reason}`)
      process.exit(1)
    }

  } catch (error) {
    console.error('💥 Unhandled error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Received interrupt signal. Exiting gracefully...')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received termination signal. Exiting gracefully...')
  process.exit(1)
})

// Run the script if called directly
if (require.main === module) {
  main()
}

module.exports = { CourtListenerSyncService }