/**
 * CourtListener Judges Sync Script
 * 
 * Fetches judges from CourtListener API v4 /people/ endpoint and syncs with database.
 * Maps judge position data to establish real court relationships based on actual appointments.
 * 
 * Features:
 * - Position-based court relationship mapping (not string matching)
 * - Handles multiple court appointments per judge
 * - Maps position types (Chief Judge, Senior Judge, etc.)
 * - Tracks appointment dates, tenure, and status
 * - Updates existing judges with CourtListener metadata
 * - Creates new judges from CourtListener data
 * - Comprehensive error handling and logging
 * - Rate limiting and pagination
 * - Data backup before modifications
 * 
 * Usage:
 *   node scripts/sync-courtlistener-judges.js
 * 
 * Requirements:
 *   - COURTLISTENER_API_KEY in .env.local
 *   - Supabase connection configured
 *   - Courts table populated with CourtListener IDs
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

class CourtListenerJudgesSyncService {
  constructor() {
    // Validate required environment variables
    this.validateEnvironment()

    // Initialize API configuration
    this.baseUrl = process.env.COURTLISTENER_BASE_URL || 'https://www.courtlistener.com/api/rest/v4'
    this.apiToken = process.env.COURTLISTENER_API_KEY
    this.rateLimit = 1200 // 1.2 seconds between requests (be conservative)

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Statistics tracking
    this.stats = {
      totalFetched: 0,
      newJudges: 0,
      updatedJudges: 0,
      skippedJudges: 0,
      positionsMapped: 0,
      courtRelationshipsCreated: 0,
      errors: 0,
      startTime: new Date(),
      apiRequestsCount: 0
    }

    // Cache for court ID mappings
    this.courtMappingCache = new Map()

    console.log('⚖️ CourtListener Judges Sync Service initialized')
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
   * Create backup of current judges data
   */
  async createBackup() {
    try {
      console.log('💾 Creating backup of current judges data...')
      
      const { data: judges, error } = await this.supabase
        .from('judges')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch judges for backup: ${error.message}`)
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        totalJudges: judges.length,
        judges: judges
      }

      const backupPath = path.join(__dirname, `judges-backup-${Date.now()}.json`)
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
      
      console.log(`✅ Backup created: ${backupPath}`)
      console.log(`📊 Backed up ${judges.length} judges`)
      
      return backupPath
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message)
      throw error
    }
  }

  /**
   * Load court mappings from database for position mapping
   */
  async loadCourtMappings() {
    try {
      console.log('🏛️ Loading court mappings from database...')
      
      const { data: courts, error } = await this.supabase
        .from('courts')
        .select('id, name, courtlistener_id')
        .not('courtlistener_id', 'is', null)

      if (error) {
        throw new Error(`Failed to load court mappings: ${error.message}`)
      }

      // Build mapping cache: CourtListener ID -> Our Court ID
      for (const court of courts) {
        this.courtMappingCache.set(court.courtlistener_id, {
          id: court.id,
          name: court.name
        })
      }

      console.log(`✅ Loaded ${courts.length} court mappings`)
      return courts.length
    } catch (error) {
      console.error('❌ Failed to load court mappings:', error.message)
      throw error
    }
  }

  /**
   * Fetch people from CourtListener API with pagination
   * Filters for people with judge positions only
   */
  async fetchAllJudges() {
    const allJudges = []
    let nextUrl = `${this.baseUrl}/people/?format=json&page_size=100&has_positions=true`
    let pageCount = 0

    console.log('📥 Fetching judges from CourtListener API...')

    while (nextUrl) {
      try {
        pageCount++
        console.log(`📄 Fetching page ${pageCount}...`)

        const response = await this.makeApiRequest(nextUrl)
        
        if (!response.results || !Array.isArray(response.results)) {
          throw new Error('Invalid API response: missing results array')
        }

        // Fetch position details for each person and filter for judges
        const judgesOnPage = []
        for (const person of response.results) {
          try {
            const personWithPositions = await this.fetchPersonPositions(person)
            if (this.hasJudgePositions(personWithPositions)) {
              judgesOnPage.push(personWithPositions)
            }
          } catch (error) {
            console.error(`   ⚠️ Error fetching positions for person ${person.id}:`, error.message)
            this.stats.errors++
            continue
          }
        }
        
        allJudges.push(...judgesOnPage)
        this.stats.totalFetched = allJudges.length

        console.log(`   📊 Page ${pageCount}: ${response.results.length} people, ${judgesOnPage.length} judges`)
        console.log(`   🔄 Total judges fetched: ${allJudges.length}`)

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

    console.log(`✅ Completed fetching ${allJudges.length} judges from ${pageCount} pages`)
    return allJudges
  }

  /**
   * Fetch detailed position data for a person
   */
  async fetchPersonPositions(person) {
    if (!person.positions || !Array.isArray(person.positions)) {
      return { ...person, positions: [] }
    }

    const detailedPositions = []
    
    for (const positionUrl of person.positions) {
      try {
        await this.sleep(200) // Small delay between position requests
        const positionData = await this.makeApiRequest(positionUrl)
        detailedPositions.push(positionData)
      } catch (error) {
        console.error(`     ⚠️ Error fetching position ${positionUrl}:`, error.message)
        this.stats.errors++
        continue
      }
    }

    return { ...person, positions: detailedPositions }
  }

  /**
   * Check if person has judge positions
   */
  hasJudgePositions(person) {
    if (!person.positions || !Array.isArray(person.positions)) {
      return false
    }

    const judgeTypes = [
      'jud',     // Judge
      'c-jud',   // Chief Judge
      's-jud',   // Senior Judge
      'pj',      // Presiding Judge
      'aj',      // Associate Judge
      'mag-jud', // Magistrate Judge
      'ref-jud', // Referee Judge
      'ret-jud', // Retired Judge
      'act-jud', // Acting Judge
      'spec-jud' // Special Judge
    ]

    return person.positions.some(position => 
      position.position_type && judgeTypes.includes(position.position_type)
    )
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
      
      this.stats.apiRequestsCount++
      
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
   * Map CourtListener judge data to our database schema
   */
  async mapJudgeData(personData) {
    try {
      // Basic judge information
      const fullName = this.buildFullName(personData)
      const education = this.extractEducation(personData)
      const bio = this.buildBiography(personData)

      // Process positions to determine primary court and metadata
      const positionData = await this.processPositions(personData.positions || [])

      // Prepare CourtListener metadata
      const courtlistenerData = {
        id: personData.id,
        resource_uri: personData.resource_uri,
        date_created: personData.date_created,
        date_modified: personData.date_modified,
        name_first: personData.name_first,
        name_middle: personData.name_middle,
        name_last: personData.name_last,
        name_suffix: personData.name_suffix,
        date_dob: personData.date_dob,
        date_granularity_dob: personData.date_granularity_dob,
        date_dod: personData.date_dod,
        date_granularity_dod: personData.date_granularity_dod,
        dob_city: personData.dob_city,
        dob_state: personData.dob_state,
        dob_country: personData.dob_country,
        slug: personData.slug,
        gender: personData.gender,
        religion: personData.religion,
        ftm_total_received: personData.ftm_total_received,
        ftm_eid: personData.ftm_eid,
        has_photo: personData.has_photo,
        positions: personData.positions,
        educations: personData.educations,
        political_affiliations: personData.political_affiliations,
        aba_ratings: personData.aba_ratings,
        sources: personData.sources,
        aliases: personData.aliases
      }

      const mappedJudge = {
        name: fullName,
        court_id: positionData.primaryCourtId,
        court_name: positionData.primaryCourtName,
        jurisdiction: positionData.jurisdiction || 'Unknown',
        appointed_date: positionData.primaryAppointmentDate,
        education: education,
        bio: bio,
        courtlistener_id: personData.id.toString(),
        courtlistener_data: courtlistenerData,
        updated_at: new Date().toISOString()
      }

      return {
        judge: mappedJudge,
        positions: positionData.allPositions
      }
    } catch (error) {
      console.error(`❌ Error mapping judge data for person ID ${personData.id}:`, error.message)
      throw error
    }
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
   * Extract education information
   */
  extractEducation(personData) {
    if (!personData.educations || !Array.isArray(personData.educations)) {
      return null
    }

    const educationEntries = personData.educations
      .filter(edu => edu.school)
      .map(edu => {
        const parts = []
        if (edu.school.name) parts.push(edu.school.name)
        if (edu.degree_year) parts.push(`(${edu.degree_year})`)
        if (edu.degree_detail) parts.push(edu.degree_detail)
        return parts.join(' ')
      })

    return educationEntries.length > 0 ? educationEntries.join('; ') : null
  }

  /**
   * Build biography from available data
   */
  buildBiography(personData) {
    const bioParts = []

    // Add basic info if available
    if (personData.date_dob) {
      bioParts.push(`Born: ${personData.date_dob}`)
    }

    if (personData.dob_city || personData.dob_state) {
      const birthPlace = [personData.dob_city, personData.dob_state].filter(Boolean).join(', ')
      bioParts.push(`Birth Place: ${birthPlace}`)
    }

    // Add political affiliations
    if (personData.political_affiliations && personData.political_affiliations.length > 0) {
      const affiliations = personData.political_affiliations
        .map(aff => aff.political_party)
        .filter(Boolean)
        .join(', ')
      if (affiliations) {
        bioParts.push(`Political Affiliations: ${affiliations}`)
      }
    }

    // Add ABA ratings
    if (personData.aba_ratings && personData.aba_ratings.length > 0) {
      const ratings = personData.aba_ratings
        .map(rating => `${rating.rating} (${rating.year_rated})`)
        .join(', ')
      bioParts.push(`ABA Ratings: ${ratings}`)
    }

    return bioParts.length > 0 ? bioParts.join('\n') : null
  }

  /**
   * Process judge positions to establish court relationships
   */
  async processPositions(positions) {
    const judgePositions = positions.filter(pos => this.isJudgePosition(pos))
    const allPositions = []
    
    let primaryCourtId = null
    let primaryCourtName = null
    let primaryAppointmentDate = null
    let jurisdiction = null

    for (const position of judgePositions) {
      try {
        // Map position to our court if possible
        const courtMapping = this.getCourtMapping(position)
        
        if (courtMapping) {
          // This is the primary court (first mapped court found)
          if (!primaryCourtId) {
            primaryCourtId = courtMapping.id
            primaryCourtName = courtMapping.name
            primaryAppointmentDate = position.date_start
            jurisdiction = this.determineJurisdiction(position)
          }
        }

        // Store position metadata
        const positionData = {
          courtlistener_court_id: position.court?.toString(),
          court_name: position.court_name || courtMapping?.name,
          position_type: position.position_type,
          appointment_date: position.date_start,
          termination_date: position.date_termination,
          appointer: position.appointer,
          supervisor: position.supervisor,
          predecessor: position.predecessor,
          how_selected: position.how_selected,
          nomination_process: position.nomination_process,
          vote_type: position.vote_type,
          voice_vote: position.voice_vote,
          votes_yes: position.votes_yes,
          votes_no: position.votes_no,
          votes_yes_percent: position.votes_yes_percent,
          votes_no_percent: position.votes_no_percent,
          confirmation_date: position.date_confirmation,
          hearing_date: position.date_hearing,
          judicial_committee_action: position.judicial_committee_action,
          committee_date: position.committee_date,
          recess_appointment_date: position.date_recess_appointment,
          referral_date: position.date_referral,
          retirement_date: position.date_retirement,
          termination_reason: position.termination_reason,
          retention_events: position.retention_events
        }

        allPositions.push(positionData)
        this.stats.positionsMapped++

      } catch (error) {
        console.error(`❌ Error processing position:`, error.message)
        this.stats.errors++
        continue
      }
    }

    return {
      primaryCourtId,
      primaryCourtName,
      primaryAppointmentDate,
      jurisdiction,
      allPositions
    }
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
   * Get court mapping from CourtListener court ID
   */
  getCourtMapping(position) {
    if (!position.court) return null
    
    const courtId = position.court.toString()
    return this.courtMappingCache.get(courtId) || null
  }

  /**
   * Determine jurisdiction from position data
   */
  determineJurisdiction(position) {
    // If we have court mapping, check the court's jurisdiction
    const courtMapping = this.getCourtMapping(position)
    if (courtMapping) {
      // Could fetch jurisdiction from court record if needed
      return 'CA' // Assuming California focus for now
    }

    // Fallback to federal vs state based on position type
    if (position.court_name && position.court_name.includes('District Court')) {
      return 'Federal'
    }

    return 'CA' // Default to California
  }

  /**
   * Sync judges data with database
   */
  async syncJudges(judgesData) {
    console.log(`🔄 Syncing ${judgesData.length} judges with database...`)

    for (let i = 0; i < judgesData.length; i++) {
      const judgeData = judgesData[i]
      const progress = `[${i + 1}/${judgesData.length}]`

      try {
        console.log(`${progress} Processing judge: ${judgeData.name_first} ${judgeData.name_last}`)

        // Map CourtListener data to our schema
        const { judge, positions } = await this.mapJudgeData(judgeData)

        // Check if judge already exists by courtlistener_id
        const { data: existingJudge, error: searchError } = await this.supabase
          .from('judges')
          .select('id, name, courtlistener_id, updated_at')
          .eq('courtlistener_id', judge.courtlistener_id)
          .single()

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw new Error(`Database search error: ${searchError.message}`)
        }

        if (existingJudge) {
          // Update existing judge
          const { error: updateError } = await this.supabase
            .from('judges')
            .update({
              name: judge.name,
              court_id: judge.court_id,
              court_name: judge.court_name,
              jurisdiction: judge.jurisdiction,
              appointed_date: judge.appointed_date,
              education: judge.education,
              bio: judge.bio,
              courtlistener_data: judge.courtlistener_data,
              updated_at: judge.updated_at
            })
            .eq('id', existingJudge.id)

          if (updateError) {
            throw new Error(`Failed to update judge: ${updateError.message}`)
          }

          console.log(`   ✅ Updated existing judge: ${existingJudge.name}`)
          this.stats.updatedJudges++

        } else {
          // Create new judge
          const { error: insertError } = await this.supabase
            .from('judges')
            .insert([judge])

          if (insertError) {
            throw new Error(`Failed to insert judge: ${insertError.message}`)
          }

          console.log(`   🆕 Created new judge: ${judge.name}`)
          this.stats.newJudges++
        }

        // Track court relationships created
        if (judge.court_id) {
          this.stats.courtRelationshipsCreated++
        }

      } catch (error) {
        console.error(`   ❌ Error processing judge ${judgeData.id}:`, error.message)
        this.stats.errors++
        this.stats.skippedJudges++
        
        // Continue processing other judges
        continue
      }

      // Rate limiting between database operations
      if (i < judgesData.length - 1) {
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

    console.log('\n📊 CourtListener Judges Sync Report')
    console.log('=' .repeat(50))
    console.log(`⏱️  Duration: ${duration} seconds`)
    console.log(`📡 API requests made: ${this.stats.apiRequestsCount}`)
    console.log(`📥 Total judges fetched from API: ${this.stats.totalFetched}`)
    console.log(`🆕 New judges created: ${this.stats.newJudges}`)
    console.log(`🔄 Existing judges updated: ${this.stats.updatedJudges}`)
    console.log(`⏭️  Judges skipped: ${this.stats.skippedJudges}`)
    console.log(`🏛️  Court relationships created: ${this.stats.courtRelationshipsCreated}`)
    console.log(`📋 Positions mapped: ${this.stats.positionsMapped}`)
    console.log(`❌ Errors encountered: ${this.stats.errors}`)

    // Get final database statistics
    try {
      const { count: totalJudges, error } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ Could not fetch final judge count: ${error.message}`)
      } else {
        console.log(`📊 Total judges in database: ${totalJudges}`)
      }

      // California-specific stats
      const { count: caJudges, error: caError } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')

      if (caError) {
        console.log(`❌ Could not fetch CA judge count: ${caError.message}`)
      } else {
        console.log(`⚖️  California judges: ${caJudges}`)
      }

      // Judges with CourtListener IDs
      const { count: mappedJudges, error: mappedError } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .not('courtlistener_id', 'is', null)

      if (mappedError) {
        console.log(`❌ Could not fetch mapped judge count: ${mappedError.message}`)
      } else {
        console.log(`🔗 Judges with CourtListener mapping: ${mappedJudges}`)
      }

      // Judges with court assignments
      const { count: assignedJudges, error: assignedError } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .not('court_id', 'is', null)

      if (assignedError) {
        console.log(`❌ Could not fetch assigned judge count: ${assignedError.message}`)
      } else {
        console.log(`🏛️  Judges with court assignments: ${assignedJudges}`)
      }

    } catch (error) {
      console.log(`❌ Error generating database statistics: ${error.message}`)
    }

    console.log('=' .repeat(50))

    const success = this.stats.errors === 0 || this.stats.errors < this.stats.totalFetched * 0.1
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
      console.log('🚀 Starting CourtListener Judges Sync...')
      console.log(`📅 Start time: ${this.stats.startTime.toISOString()}\n`)

      // Step 1: Create backup
      await this.createBackup()

      // Step 2: Load court mappings
      const courtCount = await this.loadCourtMappings()
      if (courtCount === 0) {
        console.log('⚠️  No courts with CourtListener IDs found. Please run court sync first.')
        return { success: false, reason: 'No court mappings available' }
      }

      // Step 3: Fetch all judges from CourtListener
      const judgesData = await this.fetchAllJudges()

      if (judgesData.length === 0) {
        console.log('⚠️  No judges fetched from API. Exiting.')
        return { success: false, reason: 'No data fetched' }
      }

      // Step 4: Sync with database
      await this.syncJudges(judgesData)

      // Step 5: Generate report
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
    const syncService = new CourtListenerJudgesSyncService()
    const result = await syncService.run()

    if (result.success) {
      console.log('\n🎉 CourtListener judges sync completed successfully!')
      process.exit(0)
    } else {
      console.log('\n💥 CourtListener judges sync failed')
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

module.exports = { CourtListenerJudgesSyncService }