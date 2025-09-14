const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function linkCasesToJudges() {
  console.log('🔗 Starting case-to-judge linking process...\n');
  
  try {
    // Step 1: Get all judges
    console.log('📊 Fetching all judges...');
    const { data: judges, error: judgeError } = await supabase
      .from('judges')
      .select('id, name')
      .order('name');
    
    if (judgeError) throw judgeError;
    console.log(`✅ Found ${judges.length} judges\n`);
    
    // Step 2: Get all unlinked cases
    console.log('📋 Fetching unlinked cases...');
    const { data: cases, error: caseError } = await supabase
      .from('cases')
      .select('id, case_name, judge_name')
      .is('judge_id', null);
    
    if (caseError) throw caseError;
    console.log(`✅ Found ${cases.length} unlinked cases\n`);
    
    // Step 3: Create judge name mapping for faster lookup
    const judgeMap = new Map();
    judges.forEach(judge => {
      // Store by exact name
      judgeMap.set(judge.name.toLowerCase().trim(), judge.id);
      
      // Also store common variations
      const nameParts = judge.name.split(' ');
      
      // Last name only (e.g., "Smith" for "John Smith")
      if (nameParts.length > 1) {
        const lastName = nameParts[nameParts.length - 1];
        if (!judgeMap.has(lastName.toLowerCase())) {
          judgeMap.set(lastName.toLowerCase(), judge.id);
        }
      }
      
      // First initial + last name (e.g., "J. Smith" for "John Smith")
      if (nameParts.length >= 2) {
        const firstInitial = nameParts[0][0];
        const lastName = nameParts[nameParts.length - 1];
        const initialFormat = `${firstInitial}. ${lastName}`.toLowerCase();
        judgeMap.set(initialFormat, judge.id);
      }
      
      // Remove middle initials for matching (e.g., "John Smith" matches "John M. Smith")
      if (nameParts.length === 3 && nameParts[1].length === 2 && nameParts[1][1] === '.') {
        const withoutMiddle = `${nameParts[0]} ${nameParts[2]}`.toLowerCase();
        judgeMap.set(withoutMiddle, judge.id);
      }
    });
    
    console.log('🔍 Matching cases to judges...');
    let matched = 0;
    let unmatched = 0;
    const updates = [];
    const unmatchedJudgeNames = new Set();
    
    for (const caseItem of cases) {
      if (!caseItem.judge_name) {
        unmatched++;
        continue;
      }
      
      const judgeName = caseItem.judge_name.toLowerCase().trim();
      let judgeId = null;
      
      // Try exact match first
      if (judgeMap.has(judgeName)) {
        judgeId = judgeMap.get(judgeName);
      } else {
        // Try various formats
        const cleanName = judgeName
          .replace(/hon\.|judge|honorable/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (judgeMap.has(cleanName)) {
          judgeId = judgeMap.get(cleanName);
        } else {
          // Try fuzzy matching for common variations
          for (const [mapName, mapId] of judgeMap.entries()) {
            if (cleanName.includes(mapName) || mapName.includes(cleanName)) {
              judgeId = mapId;
              break;
            }
          }
        }
      }
      
      if (judgeId) {
        updates.push({
          id: caseItem.id,
          judge_id: judgeId
        });
        matched++;
        
        // Batch update every 1000 records
        if (updates.length >= 1000) {
          console.log(`   Updating batch of ${updates.length} cases...`);
          const { error: updateError } = await supabase
            .from('cases')
            .upsert(updates, { onConflict: 'id' });
          
          if (updateError) {
            console.error('Error updating batch:', updateError);
          }
          updates.length = 0; // Clear the array
        }
      } else {
        unmatched++;
        unmatchedJudgeNames.add(caseItem.judge_name);
      }
      
      // Progress indicator
      if ((matched + unmatched) % 10000 === 0) {
        console.log(`   Processed ${matched + unmatched} / ${cases.length} cases...`);
      }
    }
    
    // Update remaining cases
    if (updates.length > 0) {
      console.log(`   Updating final batch of ${updates.length} cases...`);
      const { error: updateError } = await supabase
        .from('cases')
        .upsert(updates, { onConflict: 'id' });
      
      if (updateError) {
        console.error('Error updating final batch:', updateError);
      }
    }
    
    console.log('\n✅ Case linking complete!');
    console.log(`   ✓ Matched: ${matched} cases`);
    console.log(`   ✗ Unmatched: ${unmatched} cases`);
    
    if (unmatchedJudgeNames.size > 0) {
      console.log(`\n⚠️  Found ${unmatchedJudgeNames.size} unique unmatched judge names`);
      console.log('   Sample unmatched names:');
      const sampleNames = Array.from(unmatchedJudgeNames).slice(0, 10);
      sampleNames.forEach(name => console.log(`     - "${name}"`));
    }
    
    // Step 4: Update judge case counts
    console.log('\n📊 Updating judge case counts...');
    
    for (const judge of judges) {
      const { count, error: countError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', judge.id);
      
      if (!countError && count !== null) {
        await supabase
          .from('judges')
          .update({ total_cases: count })
          .eq('id', judge.id);
      }
      
      // Progress indicator for judge updates
      if (judges.indexOf(judge) % 100 === 0) {
        console.log(`   Updated ${judges.indexOf(judge)} / ${judges.length} judges...`);
      }
    }
    
    console.log('✅ Judge case counts updated!\n');
    
    // Step 5: Final verification
    console.log('🔍 Final verification...');
    const { count: linkedCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .not('judge_id', 'is', null);
    
    const { count: totalCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 Final Statistics:`);
    console.log(`   Total cases: ${totalCount}`);
    console.log(`   Linked cases: ${linkedCount}`);
    console.log(`   Link rate: ${((linkedCount/totalCount) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Error linking cases to judges:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

linkCasesToJudges();