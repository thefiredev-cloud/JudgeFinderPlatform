#!/usr/bin/env node

/**
 * Comprehensive California Courts Import Script
 * Imports ALL court types and levels from CourtListener
 * Including Federal, State, and Specialized courts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const COURTLISTENER_API_KEY = process.env.COURTLISTENER_API_KEY || '11b745157612fd1895856aedf5421a3bc8ecea34';
const COURTLISTENER_BASE_URL = 'https://www.courtlistener.com/api/rest/v4';

// California court IDs and mappings from CourtListener
const CA_COURT_MAPPINGS = {
  federal: {
    district: [
      { id: 'cacd', name: 'U.S. District Court, Central District of California', location: 'Los Angeles' },
      { id: 'caed', name: 'U.S. District Court, Eastern District of California', location: 'Sacramento' },
      { id: 'cand', name: 'U.S. District Court, Northern District of California', location: 'San Francisco' },
      { id: 'casd', name: 'U.S. District Court, Southern District of California', location: 'San Diego' }
    ],
    bankruptcy: [
      { id: 'cabce', name: 'U.S. Bankruptcy Court, Central District of California', location: 'Los Angeles' },
      { id: 'cabee', name: 'U.S. Bankruptcy Court, Eastern District of California', location: 'Sacramento' },
      { id: 'cabn', name: 'U.S. Bankruptcy Court, Northern District of California', location: 'San Francisco' },
      { id: 'cabs', name: 'U.S. Bankruptcy Court, Southern District of California', location: 'San Diego' }
    ],
    circuit: [
      { id: 'ca9', name: 'U.S. Court of Appeals for the Ninth Circuit', location: 'San Francisco' }
    ]
  },
  state: {
    supreme: [
      { id: 'cal', name: 'California Supreme Court', location: 'San Francisco' }
    ],
    appellate: [
      { id: 'calctapp1', name: 'California Court of Appeal, First Appellate District', location: 'San Francisco' },
      { id: 'calctapp2', name: 'California Court of Appeal, Second Appellate District', location: 'Los Angeles' },
      { id: 'calctapp3', name: 'California Court of Appeal, Third Appellate District', location: 'Sacramento' },
      { id: 'calctapp4', name: 'California Court of Appeal, Fourth Appellate District', location: 'San Diego' },
      { id: 'calctapp5', name: 'California Court of Appeal, Fifth Appellate District', location: 'Fresno' },
      { id: 'calctapp6', name: 'California Court of Appeal, Sixth Appellate District', location: 'San Jose' }
    ],
    trial: [] // Will be populated with all 58 Superior Courts
  },
  specialized: [
    { id: 'calwcab', name: 'California Workers\' Compensation Appeals Board', location: 'San Francisco' },
    { id: 'caltax', name: 'California Tax Court', location: 'Sacramento' },
    { id: 'calperb', name: 'California Public Employment Relations Board', location: 'Sacramento' },
    { id: 'calag', name: 'California Agricultural Labor Relations Board', location: 'Sacramento' }
  ]
};

// California's 58 counties for Superior Courts
const CA_COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa', 'Del Norte',
  'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake',
  'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced', 'Modoc',
  'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer', 'Plumas', 'Riverside', 'Sacramento',
  'San Benito', 'San Bernardino', 'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo',
  'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou',
  'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare', 'Tuolumne',
  'Ventura', 'Yolo', 'Yuba'
];

// Generate Superior Court entries
CA_COUNTIES.forEach(county => {
  const courtId = `calsuper${county.toLowerCase().replace(/\s+/g, '')}`;
  CA_COURT_MAPPINGS.state.trial.push({
    id: courtId,
    name: `Superior Court of California, County of ${county}`,
    location: county
  });
});

async function fetchCourtFromAPI(courtId) {
  try {
    const url = `${COURTLISTENER_BASE_URL}/courts/${courtId}/?format=json`;
    console.log(`Fetching court: ${courtId}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${COURTLISTENER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Court ${courtId} not found in CourtListener`);
        return null;
      }
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await sleep(1000); // Rate limiting
    return data;
  } catch (error) {
    console.error(`Error fetching court ${courtId}:`, error.message);
    return null;
  }
}

async function importCourt(courtData, systemType, levelType) {
  const courtRecord = {
    name: courtData.name || courtData.full_name,
    type: systemType === 'federal' ? 'federal' : 'state',
    court_system: systemType,
    court_level: levelType,
    level: mapToCourtLevelEnum(systemType, levelType),
    jurisdiction: 'CA',
    address: courtData.location || null,
    website: courtData.url || null,
    is_appellate: levelType.includes('appellate') || levelType === 'supreme' || levelType === 'circuit',
    courtlistener_id: courtData.id,
    courthouse_metadata: {
      short_name: courtData.short_name,
      citation_string: courtData.citation_string,
      in_use: courtData.in_use !== false,
      has_opinion_scraper: courtData.has_opinion_scraper || false,
      has_oral_argument_scraper: courtData.has_oral_argument_scraper || false,
      position_count: courtData.position_count || 0,
      established_date: courtData.start_date || null,
      api_data: courtData
    }
  };

  try {
    // Check if court already exists
    const { data: existing } = await supabase
      .from('courts')
      .select('id')
      .eq('courtlistener_id', courtData.id)
      .single();

    if (existing) {
      // Update existing court
      const { error } = await supabase
        .from('courts')
        .update(courtRecord)
        .eq('id', existing.id);

      if (error) throw error;
      console.log(`✓ Updated court: ${courtRecord.name}`);
      return existing.id;
    } else {
      // Insert new court
      const { data, error } = await supabase
        .from('courts')
        .insert([courtRecord])
        .select('id')
        .single();

      if (error) throw error;
      console.log(`✓ Imported court: ${courtRecord.name}`);
      return data.id;
    }
  } catch (error) {
    console.error(`Error importing court ${courtData.id}:`, error.message);
    return null;
  }
}

function mapToCourtLevelEnum(systemType, levelType) {
  const mapping = {
    'federal_district': 'federal_district',
    'federal_bankruptcy': 'federal_bankruptcy',
    'federal_circuit': 'federal_circuit',
    'state_supreme': 'state_supreme',
    'state_appellate': 'state_appellate',
    'state_trial': 'state_trial',
    'specialized': 'specialized'
  };
  
  const key = `${systemType}_${levelType}`.replace('state_trial', 'state_trial');
  return mapping[key] || 'specialized';
}

async function importCourtCategory(courts, systemType, levelType) {
  console.log(`\n=== Importing ${systemType} ${levelType} courts ===`);
  let imported = 0;
  let failed = 0;

  for (const court of courts) {
    const apiData = await fetchCourtFromAPI(court.id);
    
    if (apiData) {
      const courtId = await importCourt(
        { ...court, ...apiData },
        systemType,
        levelType
      );
      
      if (courtId) {
        imported++;
      } else {
        failed++;
      }
    } else {
      // Use local data if API fails
      const courtId = await importCourt(court, systemType, levelType);
      if (courtId) {
        imported++;
      } else {
        failed++;
      }
    }
  }

  console.log(`Completed: ${imported} imported, ${failed} failed`);
  return { imported, failed };
}

async function createCourtHierarchy() {
  console.log('\n=== Establishing Court Hierarchy ===');
  
  try {
    // Set CA Supreme Court as parent for all CA appellate courts
    const { data: supremeCourt } = await supabase
      .from('courts')
      .select('id')
      .eq('courtlistener_id', 'cal')
      .single();

    if (supremeCourt) {
      await supabase
        .from('courts')
        .update({ parent_court_id: supremeCourt.id })
        .like('courtlistener_id', 'calctapp%');
      
      console.log('✓ Linked appellate courts to Supreme Court');
    }

    // Set appellate courts as parents for regional superior courts
    const countyToAppellate = {
      'First': ['Alameda', 'Contra Costa', 'Del Norte', 'Humboldt', 'Lake', 'Marin', 'Mendocino', 'Napa', 'San Francisco', 'San Mateo', 'Solano', 'Sonoma'],
      'Second': ['Los Angeles', 'San Luis Obispo', 'Santa Barbara', 'Ventura'],
      'Third': ['Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'El Dorado', 'Glenn', 'Lassen', 'Modoc', 'Nevada', 'Placer', 'Plumas', 'Sacramento', 'San Joaquin', 'Shasta', 'Sierra', 'Siskiyou', 'Sutter', 'Tehama', 'Trinity', 'Yolo', 'Yuba'],
      'Fourth': ['Imperial', 'Inyo', 'Orange', 'Riverside', 'San Bernardino', 'San Diego'],
      'Fifth': ['Fresno', 'Kern', 'Kings', 'Madera', 'Mariposa', 'Merced', 'Mono', 'Stanislaus', 'Tulare', 'Tuolumne'],
      'Sixth': ['Monterey', 'San Benito', 'Santa Clara', 'Santa Cruz']
    };

    for (const [district, counties] of Object.entries(countyToAppellate)) {
      const districtNum = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'].indexOf(district) + 1;
      const { data: appellateCourt } = await supabase
        .from('courts')
        .select('id')
        .eq('courtlistener_id', `calctapp${districtNum}`)
        .single();

      if (appellateCourt) {
        for (const county of counties) {
          await supabase
            .from('courts')
            .update({ parent_court_id: appellateCourt.id })
            .ilike('name', `%County of ${county}%`);
        }
      }
    }

    console.log('✓ Established court hierarchy');
  } catch (error) {
    console.error('Error creating hierarchy:', error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('========================================');
  console.log('COMPREHENSIVE CALIFORNIA COURTS IMPORT');
  console.log('========================================');
  console.log(`Using CourtListener API: ${COURTLISTENER_BASE_URL}`);
  console.log(`Total courts to import: ${
    Object.values(CA_COURT_MAPPINGS.federal).flat().length +
    Object.values(CA_COURT_MAPPINGS.state).flat().length +
    CA_COURT_MAPPINGS.specialized.length
  }`);

  const stats = {
    federal: { imported: 0, failed: 0 },
    state: { imported: 0, failed: 0 },
    specialized: { imported: 0, failed: 0 }
  };

  try {
    // Import Federal Courts
    for (const [levelType, courts] of Object.entries(CA_COURT_MAPPINGS.federal)) {
      const result = await importCourtCategory(courts, 'federal', levelType);
      stats.federal.imported += result.imported;
      stats.federal.failed += result.failed;
    }

    // Import State Courts
    for (const [levelType, courts] of Object.entries(CA_COURT_MAPPINGS.state)) {
      const result = await importCourtCategory(courts, 'state', levelType);
      stats.state.imported += result.imported;
      stats.state.failed += result.failed;
    }

    // Import Specialized Courts
    const result = await importCourtCategory(CA_COURT_MAPPINGS.specialized, 'specialized', 'specialized');
    stats.specialized.imported += result.imported;
    stats.specialized.failed += result.failed;

    // Create court hierarchy relationships
    await createCourtHierarchy();

    // Final statistics
    console.log('\n========================================');
    console.log('IMPORT COMPLETE');
    console.log('========================================');
    console.log(`Federal Courts: ${stats.federal.imported} imported, ${stats.federal.failed} failed`);
    console.log(`State Courts: ${stats.state.imported} imported, ${stats.state.failed} failed`);
    console.log(`Specialized Courts: ${stats.specialized.imported} imported, ${stats.specialized.failed} failed`);
    console.log(`TOTAL: ${
      stats.federal.imported + stats.state.imported + stats.specialized.imported
    } imported, ${
      stats.federal.failed + stats.state.failed + stats.specialized.failed
    } failed`);

    // Update court judge counts
    console.log('\n=== Updating judge counts ===');
    const { error } = await supabase.rpc('update_court_judge_counts');
    if (error) {
      console.error('Error updating judge counts:', error.message);
    } else {
      console.log('✓ Updated judge counts for all courts');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Add RPC function for updating judge counts (add this to your Supabase SQL)
const updateJudgeCountsSQL = `
CREATE OR REPLACE FUNCTION update_court_judge_counts()
RETURNS void AS $$
BEGIN
  UPDATE courts c
  SET judge_count = (
    SELECT COUNT(DISTINCT j.id)
    FROM judges j
    WHERE j.court_id = c.id
    AND j.is_active = true
  );
END;
$$ LANGUAGE plpgsql;
`;

main().catch(console.error);