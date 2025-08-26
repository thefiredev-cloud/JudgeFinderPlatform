require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickFixDataIntegrity() {
  console.log('🚀 Starting quick data integrity fixes...\n');

  try {
    // Fix 1: Update Unknown jurisdiction to CA for judges that should be California judges
    console.log('🔧 Fix 1: Updating jurisdiction for Unknown judges...');
    
    const { data: unknownJudges, error: unknownError } = await supabase
      .from('judges')
      .update({ jurisdiction: 'CA' })
      .eq('jurisdiction', 'Unknown')
      .select('count');

    if (unknownError) {
      console.error('❌ Error updating Unknown jurisdiction:', unknownError);
    } else {
      console.log(`✅ Updated ${unknownJudges?.length || 0} judges from Unknown to CA jurisdiction`);
    }

    // Fix 2: Set court_name based on court_id where missing
    console.log('\n🔧 Fix 2: Populating missing court_name from court_id...');
    
    const { data: missingCourtName } = await supabase
      .from('judges')
      .select(`
        id, 
        name, 
        court_id,
        courts!inner(name)
      `)
      .is('court_name', null)
      .not('court_id', 'is', null)
      .limit(100);

    let courtNameUpdates = 0;
    if (missingCourtName) {
      for (const judge of missingCourtName) {
        if (judge.courts?.name) {
          const { error: updateError } = await supabase
            .from('judges')
            .update({ court_name: judge.courts.name })
            .eq('id', judge.id);

          if (!updateError) {
            courtNameUpdates++;
          }
        }
      }
    }
    console.log(`✅ Updated court_name for ${courtNameUpdates} judges`);

    // Fix 3: Assign default California Superior Court to judges without court_id
    console.log('\n🔧 Fix 3: Assigning default court to unassigned California judges...');
    
    // Get a default California Superior Court
    const { data: defaultCourt } = await supabase
      .from('courts')
      .select('id, name')
      .eq('jurisdiction', 'CA')
      .ilike('name', '%superior%')
      .limit(1)
      .single();

    if (defaultCourt) {
      const { data: unassignedJudges, error: assignError } = await supabase
        .from('judges')
        .update({ 
          court_id: defaultCourt.id,
          court_name: defaultCourt.name
        })
        .eq('jurisdiction', 'CA')
        .is('court_id', null)
        .select('count');

      if (assignError) {
        console.error('❌ Error assigning default court:', assignError);
      } else {
        console.log(`✅ Assigned ${unassignedJudges?.length || 0} CA judges to ${defaultCourt.name}`);
      }
    }

    // Fix 4: Update judge counts for all courts
    console.log('\n🔧 Fix 4: Updating court judge counts...');
    
    const { data: courts } = await supabase
      .from('courts')
      .select('id, name');

    let courtCountUpdates = 0;
    if (courts) {
      for (const court of courts) {
        const { count } = await supabase
          .from('judges')
          .select('*', { count: 'exact', head: true })
          .eq('court_id', court.id);

        const { error: countError } = await supabase
          .from('courts')
          .update({ judge_count: count || 0 })
          .eq('id', court.id);

        if (!countError) {
          courtCountUpdates++;
        }
      }
    }
    console.log(`✅ Updated judge counts for ${courtCountUpdates} courts`);

    // Fix 5: Remove orphaned cases
    console.log('\n🔧 Fix 5: Handling orphaned cases...');
    
    const { data: orphanedCases, error: orphanError } = await supabase
      .from('cases')
      .delete()
      .is('judge_id', null)
      .select('count');

    if (orphanError) {
      console.error('❌ Error removing orphaned cases:', orphanError);
    } else {
      console.log(`✅ Removed ${orphanedCases?.length || 0} orphaned cases`);
    }

    console.log('\n🎉 Quick fixes completed! Running integrity check...\n');

    // Final check
    const { data: finalStats } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'judges_total' as metric, COUNT(*) as count FROM judges
        UNION ALL
        SELECT 
          'judges_with_court_id', COUNT(*) FROM judges WHERE court_id IS NOT NULL
        UNION ALL
        SELECT 
          'judges_ca_jurisdiction', COUNT(*) FROM judges WHERE jurisdiction = 'CA'
        UNION ALL
        SELECT 
          'judges_with_court_name', COUNT(*) FROM judges WHERE court_name IS NOT NULL
        UNION ALL
        SELECT 
          'courts_total', COUNT(*) FROM courts
      `
    }).catch(() => null);

    if (finalStats) {
      console.log('📊 Final Statistics:');
      finalStats.forEach(stat => {
        console.log(`   ${stat.metric}: ${stat.count}`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

quickFixDataIntegrity().then(() => {
  console.log('\n✅ Data integrity quick fixes completed!');
  process.exit(0);
});