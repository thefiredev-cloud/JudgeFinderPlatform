require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleDataFixes() {
  console.log('🚀 Starting simple data fixes...\n');

  try {
    // Fix 1: Count and update Unknown jurisdiction to CA
    console.log('🔧 Fix 1: Updating Unknown jurisdiction to CA...');
    
    const { data: unknownCount } = await supabase
      .from('judges')
      .select('id')
      .eq('jurisdiction', 'Unknown');

    console.log(`📊 Found ${unknownCount?.length || 0} judges with Unknown jurisdiction`);

    if (unknownCount?.length > 0) {
      const { error: unknownError } = await supabase
        .from('judges')
        .update({ jurisdiction: 'CA' })
        .eq('jurisdiction', 'Unknown');

      if (unknownError) {
        console.error('❌ Error updating Unknown jurisdiction:', unknownError);
      } else {
        console.log(`✅ Updated ${unknownCount.length} judges to CA jurisdiction`);
      }
    }

    // Fix 2: Find a default California court
    console.log('\n🔧 Fix 2: Finding default California court...');
    
    const { data: caCourts } = await supabase
      .from('courts')
      .select('id, name')
      .eq('jurisdiction', 'CA')
      .limit(5);

    console.log(`📋 Found ${caCourts?.length || 0} CA courts`);
    
    if (caCourts && caCourts.length > 0) {
      const defaultCourt = caCourts[0]; // Use first available CA court
      console.log(`🎯 Using default court: ${defaultCourt.name}`);

      // Count judges without court_id
      const { data: unassignedJudges } = await supabase
        .from('judges')
        .select('id')
        .eq('jurisdiction', 'CA')
        .is('court_id', null);

      console.log(`📊 Found ${unassignedJudges?.length || 0} unassigned CA judges`);

      if (unassignedJudges?.length > 0) {
        // Update in batches of 50
        const batchSize = 50;
        let updated = 0;

        for (let i = 0; i < unassignedJudges.length; i += batchSize) {
          const batch = unassignedJudges.slice(i, i + batchSize);
          const judgeIds = batch.map(j => j.id);

          const { error: assignError } = await supabase
            .from('judges')
            .update({ 
              court_id: defaultCourt.id,
              court_name: defaultCourt.name
            })
            .in('id', judgeIds);

          if (assignError) {
            console.error('❌ Error assigning court to batch:', assignError);
          } else {
            updated += batch.length;
            console.log(`✅ Assigned court to ${updated}/${unassignedJudges.length} judges`);
          }
        }
      }
    }

    // Fix 3: Update court judge counts
    console.log('\n🔧 Fix 3: Updating court judge counts...');
    
    const { data: allCourts } = await supabase
      .from('courts')
      .select('id, name')
      .limit(50); // Process first 50 courts

    if (allCourts) {
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
      console.log(`✅ Updated judge counts for ${allCourts.length} courts`);
    }

    // Final statistics
    console.log('\n📊 Final Statistics:');
    
    const { count: totalJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true });

    const { count: judgesWithCourts } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .not('court_id', 'is', null);

    const { count: caJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA');

    console.log(`   Total judges: ${totalJudges}`);
    console.log(`   Judges with court assignments: ${judgesWithCourts}`);
    console.log(`   California judges: ${caJudges}`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

simpleDataFixes().then(() => {
  console.log('\n✅ Simple data fixes completed!');
  process.exit(0);
});