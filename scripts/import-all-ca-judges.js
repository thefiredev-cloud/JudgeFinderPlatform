#!/usr/bin/env node

/**
 * Comprehensive California Judges Import Script
 * Imports ALL judge types from CourtListener including:
 * - Federal Article III Judges
 * - Magistrate Judges
 * - Bankruptcy Judges
 * - State Supreme Court Justices
 * - State Appellate Justices
 * - Superior Court Judges
 * - Commissioners, Referees, Pro Tems
 * - Administrative Law Judges
 * - WCAB Judges
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

// Judge position types to search for
const JUDGE_POSITION_TYPES = [
  'Judge',
  'Chief Judge',
  'Magistrate Judge',
  'Bankruptcy Judge',
  'Senior Judge',
  'Justice',
  'Chief Justice',
  'Associate Justice',
  'Presiding Justice',
  'Administrative Law Judge',
  'Commissioner',
  'Referee',
  'Judge Pro Tem',
  'Hearing Officer',
  'Workers Compensation Judge',
  'Immigration Judge',
  'Tax Court Judge'
];

// California court IDs we're interested in
const CA_COURT_IDS = [
  // Federal
  'cacd', 'caed', 'cand', 'casd', // District Courts
  'cabce', 'cabee', 'cabn', 'cabs', // Bankruptcy Courts
  'ca9', // Ninth Circuit
  // State
  'cal', // Supreme Court
  'calctapp1', 'calctapp2', 'calctapp3', 'calctapp4', 'calctapp5', 'calctapp6', // Appellate
  // Add superior court patterns
  'calsuper' // Will match all superior courts
];

async function fetchJudgesFromAPI(params = {}) {
  try {
    const queryParams = new URLSearchParams({
      format: 'json',
      page_size: '100',
      ...params
    });

    const url = `${COURTLISTENER_BASE_URL}/people/?${queryParams}`;
    console.log(`Fetching judges with params:`, params);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${COURTLISTENER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await sleep(1000); // Rate limiting
    return data;
  } catch (error) {
    console.error('Error fetching judges:', error.message);
    return null;
  }
}

async function fetchJudgeDetails(judgeId) {
  try {
    const url = `${COURTLISTENER_BASE_URL}/people/${judgeId}/?format=json`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${COURTLISTENER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    await sleep(1000); // Rate limiting
    return data;
  } catch (error) {
    console.error(`Error fetching judge ${judgeId}:`, error.message);
    return null;
  }
}

function classifyJudge(positions) {
  // Analyze all positions to determine judge classification
  const currentPosition = positions?.find(p => !p.date_termination) || positions?.[0];
  
  if (!currentPosition) return 'superior_court_judge';
  
  const positionType = currentPosition.position_type?.toLowerCase() || '';
  const courtId = currentPosition.court?.toLowerCase() || '';
  
  // Federal classifications
  if (courtId.includes('ca9')) return 'article_iii_judge';
  if (positionType.includes('magistrate')) return 'magistrate_judge';
  if (positionType.includes('bankruptcy')) return 'bankruptcy_judge';
  if (positionType.includes('senior')) return 'senior_judge';
  
  // State classifications
  if (courtId === 'cal') {
    if (positionType.includes('chief')) return 'state_supreme_justice';
    return 'state_supreme_justice';
  }
  if (courtId.includes('calctapp')) return 'state_appellate_justice';
  if (positionType.includes('commissioner')) return 'court_commissioner';
  if (positionType.includes('pro tem')) return 'judge_pro_tem';
  if (positionType.includes('referee')) return 'referee';
  if (positionType.includes('administrative law')) return 'administrative_law_judge';
  if (positionType.includes('workers comp')) return 'wcab_judge';
  if (positionType.includes('immigration')) return 'immigration_judge';
  if (positionType.includes('tax')) return 'tax_court_judge';
  if (positionType.includes('hearing officer')) return 'hearing_officer';
  
  // Default to superior court judge
  return 'superior_court_judge';
}

async function importJudge(judgeData) {
  try {
    const positions = judgeData.positions || [];
    const currentPosition = positions.find(p => !p.date_termination) || positions[0];
    const educations = judgeData.educations || [];
    const politicalAffiliations = judgeData.political_affiliations || [];
    
    // Get court information
    let courtId = null;
    let courtName = currentPosition?.court_name || null;
    
    if (currentPosition?.court) {
      const { data: court } = await supabase
        .from('courts')
        .select('id, name')
        .eq('courtlistener_id', currentPosition.court)
        .single();
      
      if (court) {
        courtId = court.id;
        courtName = court.name;
      }
    }

    const judgeRecord = {
      name: judgeData.name_full || `${judgeData.name_first} ${judgeData.name_last}`.trim(),
      court_id: courtId,
      court_name: courtName,
      jurisdiction: 'CA',
      judge_type: currentPosition?.position_type || 'Judge',
      position_type: currentPosition?.position_type,
      classification: classifyJudge(positions),
      federal_judge: currentPosition?.court?.startsWith('ca') && !currentPosition.court.startsWith('cal'),
      state_judge: currentPosition?.court?.startsWith('cal'),
      is_active: !judgeData.date_death && !currentPosition?.date_termination,
      appointed_date: currentPosition?.date_start,
      education: educations.map(e => `${e.school_name} (${e.degree_year})`).join('; '),
      bio: judgeData.biography || null,
      courtlistener_id: judgeData.id.toString(),
      courtlistener_data: {
        ...judgeData,
        positions,
        educations,
        political_affiliations: politicalAffiliations
      }
    };

    // Check if judge already exists
    const { data: existing } = await supabase
      .from('judges')
      .select('id')
      .eq('courtlistener_id', judgeData.id.toString())
      .single();

    let judgeId;
    
    if (existing) {
      // Update existing judge
      const { error } = await supabase
        .from('judges')
        .update(judgeRecord)
        .eq('id', existing.id);

      if (error) throw error;
      console.log(`✓ Updated judge: ${judgeRecord.name} (${judgeRecord.classification})`);
      judgeId = existing.id;
    } else {
      // Insert new judge
      const { data, error } = await supabase
        .from('judges')
        .insert([judgeRecord])
        .select('id')
        .single();

      if (error) throw error;
      console.log(`✓ Imported judge: ${judgeRecord.name} (${judgeRecord.classification})`);
      judgeId = data.id;
    }

    // Import position history
    if (judgeId && positions.length > 0) {
      await importJudgePositions(judgeId, positions);
    }

    // Import education history
    if (judgeId && educations.length > 0) {
      await importJudgeEducation(judgeId, educations);
    }

    return judgeId;
  } catch (error) {
    console.error(`Error importing judge ${judgeData.name_full}:`, error.message);
    return null;
  }
}

async function importJudgePositions(judgeId, positions) {
  for (const position of positions) {
    try {
      // Get court ID if available
      let courtId = null;
      if (position.court) {
        const { data: court } = await supabase
          .from('courts')
          .select('id')
          .eq('courtlistener_id', position.court)
          .single();
        
        if (court) courtId = court.id;
      }

      const positionRecord = {
        judge_id: judgeId,
        court_id: courtId,
        position_type: position.position_type || 'Judge',
        classification: classifyJudge([position]),
        appointer: position.appointer_name || position.appointer,
        appointment_date: position.date_nominated,
        confirmation_date: position.date_confirmation,
        start_date: position.date_start,
        end_date: position.date_termination,
        end_reason: position.termination_reason,
        is_current: !position.date_termination,
        predecessor_name: position.predecessor,
        courtlistener_position_id: position.id?.toString()
      };

      // Check if position exists
      const { data: existing } = await supabase
        .from('judicial_positions')
        .select('id')
        .eq('judge_id', judgeId)
        .eq('courtlistener_position_id', position.id?.toString())
        .single();

      if (!existing && position.id) {
        await supabase
          .from('judicial_positions')
          .insert([positionRecord]);
      }
    } catch (error) {
      console.error('Error importing position:', error.message);
    }
  }
}

async function importJudgeEducation(judgeId, educations) {
  for (const education of educations) {
    try {
      const educationRecord = {
        judge_id: judgeId,
        school_name: education.school_name,
        degree_type: education.degree_level || education.degree,
        degree_year: education.degree_year,
        degree_detail: education.degree_detail,
        is_law_degree: education.degree_level === 'jd' || education.degree === 'J.D.'
      };

      // Check if education exists
      const { data: existing } = await supabase
        .from('judge_education')
        .select('id')
        .eq('judge_id', judgeId)
        .eq('school_name', education.school_name)
        .eq('degree_year', education.degree_year)
        .single();

      if (!existing) {
        await supabase
          .from('judge_education')
          .insert([educationRecord]);
      }
    } catch (error) {
      console.error('Error importing education:', error.message);
    }
  }
}

async function fetchAllCAJudges() {
  const allJudges = [];
  let hasMore = true;
  let offset = 0;
  
  console.log('\n=== Fetching all California judges from CourtListener ===');
  
  while (hasMore) {
    // Search for judges with positions in California courts
    const response = await fetchJudgesFromAPI({
      positions__court__jurisdiction: 'CA',
      offset: offset.toString(),
      ordering: '-date_modified'
    });
    
    if (!response) break;
    
    console.log(`Fetched ${response.results.length} judges (offset: ${offset})`);
    
    // Filter for California judges and get detailed info
    for (const judge of response.results) {
      // Check if judge has California positions
      const hasCAPosition = judge.positions?.some(p => 
        p.court?.toLowerCase().includes('ca') ||
        p.court_name?.includes('California')
      );
      
      if (hasCAPosition) {
        // Fetch full details
        const details = await fetchJudgeDetails(judge.id);
        if (details) {
          allJudges.push(details);
        }
      }
    }
    
    hasMore = response.next !== null;
    offset += 100;
    
    // Safety limit
    if (allJudges.length >= 5000) {
      console.log('Reached safety limit of 5000 judges');
      break;
    }
  }
  
  return allJudges;
}

async function importJudgesByType(judges, type) {
  console.log(`\n=== Importing ${type} judges ===`);
  let imported = 0;
  let failed = 0;
  
  const filteredJudges = judges.filter(j => {
    const classification = classifyJudge(j.positions);
    return classification.includes(type.toLowerCase().replace(/\s+/g, '_'));
  });
  
  console.log(`Found ${filteredJudges.length} ${type} judges`);
  
  for (const judge of filteredJudges) {
    const judgeId = await importJudge(judge);
    if (judgeId) {
      imported++;
    } else {
      failed++;
    }
  }
  
  console.log(`Completed: ${imported} imported, ${failed} failed`);
  return { imported, failed };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('========================================');
  console.log('COMPREHENSIVE CALIFORNIA JUDGES IMPORT');
  console.log('========================================');
  console.log(`Using CourtListener API: ${COURTLISTENER_BASE_URL}`);
  
  const stats = {
    total: 0,
    byType: {}
  };
  
  try {
    // Fetch all California judges
    const allJudges = await fetchAllCAJudges();
    console.log(`\nTotal California judges found: ${allJudges.length}`);
    
    // Categorize judges by type
    const judgeCategories = {
      'Federal Article III': [],
      'Magistrate': [],
      'Bankruptcy': [],
      'State Supreme': [],
      'State Appellate': [],
      'Superior Court': [],
      'Commissioner': [],
      'Administrative Law': [],
      'Other': []
    };
    
    for (const judge of allJudges) {
      const classification = classifyJudge(judge.positions);
      
      if (classification.includes('article_iii')) {
        judgeCategories['Federal Article III'].push(judge);
      } else if (classification.includes('magistrate')) {
        judgeCategories['Magistrate'].push(judge);
      } else if (classification.includes('bankruptcy')) {
        judgeCategories['Bankruptcy'].push(judge);
      } else if (classification.includes('supreme')) {
        judgeCategories['State Supreme'].push(judge);
      } else if (classification.includes('appellate')) {
        judgeCategories['State Appellate'].push(judge);
      } else if (classification.includes('superior')) {
        judgeCategories['Superior Court'].push(judge);
      } else if (classification.includes('commissioner')) {
        judgeCategories['Commissioner'].push(judge);
      } else if (classification.includes('administrative')) {
        judgeCategories['Administrative Law'].push(judge);
      } else {
        judgeCategories['Other'].push(judge);
      }
    }
    
    // Display category counts
    console.log('\n=== Judge Categories ===');
    for (const [category, judges] of Object.entries(judgeCategories)) {
      console.log(`${category}: ${judges.length} judges`);
    }
    
    // Import judges by category
    for (const [category, judges] of Object.entries(judgeCategories)) {
      if (judges.length > 0) {
        console.log(`\n=== Importing ${category} Judges ===`);
        let imported = 0;
        let failed = 0;
        
        for (const judge of judges) {
          const judgeId = await importJudge(judge);
          if (judgeId) {
            imported++;
          } else {
            failed++;
          }
        }
        
        stats.byType[category] = { imported, failed };
        stats.total += imported;
      }
    }
    
    // Final statistics
    console.log('\n========================================');
    console.log('IMPORT COMPLETE');
    console.log('========================================');
    for (const [category, result] of Object.entries(stats.byType)) {
      console.log(`${category}: ${result.imported} imported, ${result.failed} failed`);
    }
    console.log(`\nTOTAL JUDGES IMPORTED: ${stats.total}`);
    
    // Create materialized view for quick lookups
    console.log('\n=== Creating search indexes ===');
    await supabase.rpc('refresh_judge_search_index');
    console.log('✓ Search indexes updated');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Add this SQL function to your Supabase
const createSearchIndexSQL = `
CREATE MATERIALIZED VIEW IF NOT EXISTS judge_search_index AS
SELECT 
  j.id,
  j.name,
  j.court_name,
  j.jurisdiction,
  j.classification,
  j.is_active,
  jp.position_type,
  jp.court_id,
  c.name as current_court_name,
  c.court_level,
  to_tsvector('english', 
    coalesce(j.name, '') || ' ' || 
    coalesce(j.court_name, '') || ' ' || 
    coalesce(jp.position_type, '')
  ) as search_vector
FROM judges j
LEFT JOIN judicial_positions jp ON j.id = jp.judge_id AND jp.is_current = true
LEFT JOIN courts c ON jp.court_id = c.id
WHERE j.jurisdiction = 'CA';

CREATE INDEX IF NOT EXISTS idx_judge_search_vector ON judge_search_index USING gin(search_vector);

CREATE OR REPLACE FUNCTION refresh_judge_search_index()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW judge_search_index;
END;
$$ LANGUAGE plpgsql;
`;

main().catch(console.error);