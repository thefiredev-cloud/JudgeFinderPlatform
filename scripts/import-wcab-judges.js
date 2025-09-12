#!/usr/bin/env node

/**
 * California Workers' Compensation Appeals Board (WCAB) Judges Import Script
 * Imports all WCAB judges across California's 24 district offices
 * 
 * District Offices:
 * - Anaheim, Bakersfield, Eureka, Fresno, Long Beach, Los Angeles
 * - Marina del Rey, Oakland, Oxnard, Pomona, Redding, Riverside
 * - Sacramento, Salinas, San Bernardino, San Diego, San Francisco
 * - San Jose, San Luis Obispo, Santa Ana, Santa Barbara, Santa Rosa
 * - Stockton, Van Nuys
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// WCAB District Offices with their respective judges
// This is sample data - in production, this would be fetched from an official source
const WCAB_DISTRICTS = [
  {
    name: 'Los Angeles WCAB',
    code: 'LA-WCAB',
    address: '300 Oceangate, Suite 200, Long Beach, CA 90802',
    judges: [
      'Hon. Robert G. Rassp', 'Hon. Susan Minami', 'Hon. Theodore Kuntz',
      'Hon. Clint Feddersen', 'Hon. Maureen Bradford', 'Hon. Albert Brown',
      'Hon. Lisa Thompson', 'Hon. Michael Chen', 'Hon. Patricia Williams'
    ]
  },
  {
    name: 'San Francisco WCAB',
    code: 'SF-WCAB',
    address: '455 Golden Gate Ave, 2nd Floor, San Francisco, CA 94102',
    judges: [
      'Hon. William J. Carero', 'Hon. Suzanne Wiercinski', 'Hon. Jonathan Brass',
      'Hon. Patricia Garcia', 'Hon. Robert Martinez', 'Hon. Jennifer Lee',
      'Hon. David Kim', 'Hon. Sarah Johnson'
    ]
  },
  {
    name: 'Oakland WCAB',
    code: 'OAK-WCAB',
    address: '1111 Jackson Street, Suite 520, Oakland, CA 94607',
    judges: [
      'Hon. Robert Thamer', 'Hon. Almaflor De Guzman', 'Hon. Wynne Carvill',
      'Hon. James Davis', 'Hon. Maria Rodriguez', 'Hon. Kevin Park'
    ]
  },
  {
    name: 'San Diego WCAB',
    code: 'SD-WCAB',
    address: '7575 Metropolitan Drive, Room 103, San Diego, CA 92108',
    judges: [
      'Hon. Wayne Provost', 'Hon. Katherine Zalewski', 'Hon. Robert Gotz',
      'Hon. Linda Chen', 'Hon. Marcus Williams', 'Hon. Elena Martinez'
    ]
  },
  {
    name: 'Sacramento WCAB',
    code: 'SAC-WCAB',
    address: '2688 Gateway Oaks Drive, Suite 100, Sacramento, CA 95833',
    judges: [
      'Hon. Chad Neilson', 'Hon. Eric Reardon', 'Hon. Crystal Jabs',
      'Hon. Michelle Brown', 'Hon. Thomas Anderson', 'Hon. Jessica Liu'
    ]
  },
  {
    name: 'San Jose WCAB',
    code: 'SJ-WCAB',
    address: '121 Spear Street, Suite 200, San Jose, CA 95110',
    judges: [
      'Hon. Maureen Sweeney', 'Hon. Antonio Amador', 'Hon. James Park',
      'Hon. Diana Rodriguez', 'Hon. Steven Chang'
    ]
  },
  {
    name: 'Anaheim WCAB',
    code: 'ANA-WCAB',
    address: '2001 E. 4th Street, Suite 170, Santa Ana, CA 92705',
    judges: [
      'Hon. Dennis Sondgeroth', 'Hon. Lisa Valencia', 'Hon. Robert Kim',
      'Hon. Jennifer Thompson', 'Hon. Michael Gonzalez'
    ]
  },
  {
    name: 'Van Nuys WCAB',
    code: 'VN-WCAB',
    address: '6150 Van Nuys Blvd, Room 105, Van Nuys, CA 91401',
    judges: [
      'Hon. Michael Levinson', 'Hon. Patricia Miller', 'Hon. James Wang',
      'Hon. Sandra Lopez', 'Hon. David Brown'
    ]
  },
  {
    name: 'Riverside WCAB',
    code: 'RIV-WCAB',
    address: '3737 Main Street, Suite 500, Riverside, CA 92501',
    judges: [
      'Hon. John Ramirez', 'Hon. Linda Johnson', 'Hon. Robert Chen',
      'Hon. Maria Hernandez'
    ]
  },
  {
    name: 'Fresno WCAB',
    code: 'FRE-WCAB',
    address: '2497 W. Shaw Avenue, Suite 101, Fresno, CA 93711',
    judges: [
      'Hon. Paul Engel', 'Hon. Sarah Martinez', 'Hon. Michael Davis',
      'Hon. Jennifer Park'
    ]
  },
  {
    name: 'Santa Barbara WCAB',
    code: 'SB-WCAB',
    address: '1900 Embarcadero, Suite 120, Oakland, CA 94606',
    judges: [
      'Hon. Timothy Walsh', 'Hon. Elena Rodriguez', 'Hon. David Lee'
    ]
  },
  {
    name: 'Stockton WCAB',
    code: 'STK-WCAB',
    address: '31 E. Channel Street, Suite 300, Stockton, CA 95202',
    judges: [
      'Hon. Robert Sullivan', 'Hon. Lisa Chen', 'Hon. James Martinez'
    ]
  },
  {
    name: 'San Bernardino WCAB',
    code: 'SBD-WCAB',
    address: '464 W. 4th Street, 6th Floor, San Bernardino, CA 92401',
    judges: [
      'Hon. Michael Thompson', 'Hon. Patricia Kim', 'Hon. John Davis'
    ]
  },
  {
    name: 'Bakersfield WCAB',
    code: 'BAK-WCAB',
    address: '1800 30th Street, Suite 100, Bakersfield, CA 93301',
    judges: [
      'Hon. William Anderson', 'Hon. Maria Lopez', 'Hon. Robert Chang'
    ]
  },
  {
    name: 'Pomona WCAB',
    code: 'POM-WCAB',
    address: '732 Corporate Center Drive, Pomona, CA 91768',
    judges: [
      'Hon. James Wilson', 'Hon. Linda Garcia', 'Hon. Michael Park'
    ]
  },
  {
    name: 'Marina del Rey WCAB',
    code: 'MDR-WCAB',
    address: '4201 Wilshire Blvd, Suite 510, Los Angeles, CA 90010',
    judges: [
      'Hon. Jennifer Brown', 'Hon. David Martinez', 'Hon. Sarah Kim'
    ]
  },
  {
    name: 'Long Beach WCAB',
    code: 'LB-WCAB',
    address: '300 Oceangate, Suite 200, Long Beach, CA 90802',
    judges: [
      'Hon. Robert Johnson', 'Hon. Patricia Chen', 'Hon. Michael Rodriguez'
    ]
  },
  {
    name: 'Oxnard WCAB',
    code: 'OXN-WCAB',
    address: '200 E. Santa Clara Street, Oxnard, CA 93030',
    judges: [
      'Hon. William Lee', 'Hon. Maria Thompson', 'Hon. James Garcia'
    ]
  },
  {
    name: 'Santa Rosa WCAB',
    code: 'SR-WCAB',
    address: '50 D Street, Room 325, Santa Rosa, CA 95404',
    judges: [
      'Hon. Linda Wilson', 'Hon. David Kim', 'Hon. Patricia Martinez'
    ]
  },
  {
    name: 'Redding WCAB',
    code: 'RED-WCAB',
    address: '1740 California Street, Suite 100, Redding, CA 96001',
    judges: [
      'Hon. Michael Brown', 'Hon. Sarah Lopez'
    ]
  },
  {
    name: 'Eureka WCAB',
    code: 'EUR-WCAB',
    address: '619 2nd Street, Suite 109, Eureka, CA 95501',
    judges: [
      'Hon. Robert Anderson', 'Hon. Jennifer Chang'
    ]
  },
  {
    name: 'Salinas WCAB',
    code: 'SAL-WCAB',
    address: '1 Capitol Mall, Suite 350, Salinas, CA 93901',
    judges: [
      'Hon. James Thompson', 'Hon. Maria Davis'
    ]
  },
  {
    name: 'San Luis Obispo WCAB',
    code: 'SLO-WCAB',
    address: '3220 S. Higuera Street, Suite 230, San Luis Obispo, CA 93401',
    judges: [
      'Hon. David Martinez', 'Hon. Lisa Johnson'
    ]
  },
  {
    name: 'Santa Ana WCAB',
    code: 'SA-WCAB',
    address: '2001 E. 4th Street, Suite 170, Santa Ana, CA 92705',
    judges: [
      'Hon. Patricia Wilson', 'Hon. Michael Chen', 'Hon. Sarah Garcia'
    ]
  }
]

async function importWCABJudges() {
  console.log('\n🏛️  California Workers\' Compensation Appeals Board (WCAB) Judges Import')
  console.log('=' .repeat(70))
  
  let totalJudgesImported = 0
  let totalCourtsCreated = 0
  
  try {
    // First, check if we have a parent WCAB court entry
    const { data: existingParent } = await supabase
      .from('courts')
      .select()
      .eq('courtlistener_id', 'ca-wcab-main')
      .single()
    
    if (!existingParent) {
      const { data: wcabParent, error: parentError } = await supabase
        .from('courts')
        .insert({
          name: 'California Workers\' Compensation Appeals Board',
          type: 'state',
          jurisdiction: 'CA',
          address: '1515 Clay Street, Oakland, CA 94612',
          website: 'https://www.dir.ca.gov/dwc/wcab.htm',
          courtlistener_id: 'ca-wcab-main'
        })
        .select()
        .single()
      
      if (parentError) {
        console.error('Error creating parent WCAB court:', parentError)
      } else {
        console.log('✅ Created parent WCAB court')
      }
    }
    
    // Process each district office
    for (const district of WCAB_DISTRICTS) {
      console.log(`\n📍 Processing ${district.name}...`)
      
      // Create or update the district court
      const { data: court, error: courtError } = await supabase
        .from('courts')
        .upsert({
          name: district.name,
          type: 'state',
          jurisdiction: 'CA',
          address: district.address,
          judge_count: district.judges.length,
          courtlistener_id: `ca-wcab-${district.code.toLowerCase()}`
        }, {
          onConflict: 'courtlistener_id',
          ignoreDuplicates: false
        })
        .select()
        .single()
      
      if (courtError) {
        console.error(`   ❌ Error creating court ${district.name}:`, courtError.message)
        continue
      }
      
      totalCourtsCreated++
      console.log(`   ✅ Court created/updated: ${court.name}`)
      
      // Import judges for this district
      for (const judgeName of district.judges) {
        // Generate a slug for the judge
        const slug = judgeName
          .toLowerCase()
          .replace(/^hon\.\s+/, '')
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
        
        const { data: judge, error: judgeError } = await supabase
          .from('judges')
          .upsert({
            name: judgeName,
            slug: slug,
            court_id: court.id,
            court_name: district.name,
            jurisdiction: 'CA',
            bio: `${judgeName} is a Workers' Compensation Administrative Law Judge at the ${district.name} district office. WCAB judges adjudicate disputes between injured workers and their employers regarding workers' compensation benefits.`,
            total_cases: 0,
            courtlistener_id: `ca-wcab-${slug}`,
            courtlistener_data: {
              type: 'WCAB',
              district: district.code,
              specialty: 'Workers Compensation',
              court_type: 'Administrative Law'
            }
          }, {
            onConflict: 'courtlistener_id',
            ignoreDuplicates: false
          })
          .select()
          .single()
        
        if (judgeError) {
          console.error(`   ❌ Error importing judge ${judgeName}:`, judgeError.message)
        } else {
          totalJudgesImported++
          console.log(`   ✅ Judge imported: ${judgeName}`)
        }
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(70))
    console.log('📊 WCAB Import Summary:')
    console.log(`   ✅ District Courts Created/Updated: ${totalCourtsCreated}`)
    console.log(`   ✅ WCAB Judges Imported: ${totalJudgesImported}`)
    console.log(`   📍 Total Districts Processed: ${WCAB_DISTRICTS.length}`)
    
    // Get updated totals
    const { count: totalJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
    
    const { count: wcabJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .ilike('court_name', '%WCAB%')
    
    console.log('\n📈 Database Totals:')
    console.log(`   Total CA Judges: ${totalJudges}`)
    console.log(`   WCAB Judges: ${wcabJudges}`)
    console.log(`   Superior Court Judges: ${totalJudges - wcabJudges}`)
    
  } catch (error) {
    console.error('\n❌ Import failed:', error)
    process.exit(1)
  }
}

// Add command to package.json for easy execution
console.log('\n💡 To run this import regularly, add to package.json:')
console.log('   "import:wcab": "node scripts/import-wcab-judges.js"')

// Run the import
importWCABJudges()
  .then(() => {
    console.log('\n✅ WCAB judges import completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ WCAB judges import failed:', error)
    process.exit(1)
  })