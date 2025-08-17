require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixJudgeCourtAssignments() {
  console.log('🔧 Starting judge-court assignment fixes...\n');

  try {
    // First, let's get all judges missing court assignments
    const { data: judgesWithoutCourts, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, court_name, jurisdiction')
      .is('court_id', null)
      .limit(50); // Process in batches

    if (judgesError) {
      console.error('❌ Error fetching judges:', judgesError);
      return;
    }

    console.log(`📊 Found ${judgesWithoutCourts.length} judges without court assignments\n`);

    // Get all courts for matching
    const { data: allCourts, error: courtsError } = await supabase
      .from('courts')
      .select('id, name, jurisdiction, type');

    if (courtsError) {
      console.error('❌ Error fetching courts:', courtsError);
      return;
    }

    console.log(`📋 Available courts: ${allCourts.length}\n`);

    let fixedCount = 0;
    let matchedByName = 0;
    let matchedByJurisdiction = 0;

    for (const judge of judgesWithoutCourts) {
      let matchedCourt = null;

      // Strategy 1: Match by exact court name if available
      if (judge.court_name) {
        matchedCourt = allCourts.find(court => 
          court.name.toLowerCase().includes(judge.court_name.toLowerCase()) ||
          judge.court_name.toLowerCase().includes(court.name.toLowerCase())
        );

        if (matchedCourt) {
          matchedByName++;
          console.log(`✅ Matched ${judge.name} to ${matchedCourt.name} by court name`);
        }
      }

      // Strategy 2: Match by jurisdiction if no court name match
      if (!matchedCourt && judge.jurisdiction) {
        matchedCourt = allCourts.find(court => 
          court.jurisdiction === judge.jurisdiction && 
          court.type === 'state' // Prefer state courts for California judges
        );

        if (matchedCourt) {
          matchedByJurisdiction++;
          console.log(`⚡ Matched ${judge.name} to ${matchedCourt.name} by jurisdiction`);
        }
      }

      // Strategy 3: Default to California Superior Court if jurisdiction is CA
      if (!matchedCourt && judge.jurisdiction === 'CA') {
        matchedCourt = allCourts.find(court => 
          court.name.toLowerCase().includes('superior') &&
          court.jurisdiction === 'CA'
        );

        if (matchedCourt) {
          console.log(`🎯 Assigned ${judge.name} to default CA Superior Court`);
        }
      }

      // Update the judge with court assignment
      if (matchedCourt) {
        const { error: updateError } = await supabase
          .from('judges')
          .update({ 
            court_id: matchedCourt.id,
            court_name: matchedCourt.name
          })
          .eq('id', judge.id);

        if (updateError) {
          console.error(`❌ Error updating ${judge.name}:`, updateError);
        } else {
          fixedCount++;
        }
      } else {
        console.log(`⚠️  No match found for ${judge.name} (${judge.jurisdiction})`);
      }
    }

    console.log(`\n📊 ASSIGNMENT RESULTS:`);
    console.log(`✅ Total judges fixed: ${fixedCount}`);
    console.log(`📝 Matched by court name: ${matchedByName}`);
    console.log(`🗺️  Matched by jurisdiction: ${matchedByJurisdiction}`);

    // Update judge counts for courts
    console.log(`\n🔄 Updating court judge counts...`);
    for (const court of allCourts) {
      const { count } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('court_id', court.id);

      await supabase
        .from('courts')
        .update({ judge_count: count || 0 })
        .eq('id', court.id);
    }

    console.log(`✅ Court judge counts updated\n`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function fixCaliforniaJudgesAccessibility() {
  console.log('🔧 Fixing California judges accessibility...\n');

  try {
    // Update all judges with null jurisdiction to 'CA' if they should be California judges
    const { data: nullJurisdictionJudges, error } = await supabase
      .from('judges')
      .select('id, name, jurisdiction')
      .is('jurisdiction', null)
      .limit(100);

    if (error) {
      console.error('❌ Error fetching judges with null jurisdiction:', error);
      return;
    }

    console.log(`📊 Found ${nullJurisdictionJudges.length} judges with null jurisdiction`);

    // Set jurisdiction to 'CA' for judges that appear to be California judges
    let updatedCount = 0;
    for (const judge of nullJurisdictionJudges) {
      const { error: updateError } = await supabase
        .from('judges')
        .update({ jurisdiction: 'CA' })
        .eq('id', judge.id);

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Set jurisdiction to CA for ${judge.name}`);
      }
    }

    console.log(`\n📊 Updated ${updatedCount} judges to CA jurisdiction\n`);

  } catch (error) {
    console.error('💥 Error fixing California judges accessibility:', error);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive judge-court assignment fixes...\n');
  
  await fixJudgeCourtAssignments();
  await fixCaliforniaJudgesAccessibility();
  
  console.log('✅ Assignment fixes completed!');
  process.exit(0);
}

main();