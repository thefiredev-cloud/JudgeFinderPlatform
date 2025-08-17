require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrphanedCases() {
  console.log('🔧 Fixing orphaned cases...\n');

  try {
    // Count orphaned cases
    const { count: orphanedCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .is('judge_id', null);

    console.log(`📊 Found ${orphanedCount} orphaned cases (no judge assignment)`);

    if (orphanedCount > 0) {
      // Option 1: Try to assign to a default judge or court
      // Option 2: Delete orphaned cases (cleaner approach)
      
      console.log('🗑️  Removing orphaned cases (no judge assignment)...');
      
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .is('judge_id', null);

      if (deleteError) {
        console.error('❌ Error deleting orphaned cases:', deleteError);
      } else {
        console.log(`✅ Successfully removed ${orphanedCount} orphaned cases`);
      }
    }

    // Also check for cases with invalid court_id
    const { count: invalidCourtCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .not('court_id', 'is', null)
      .not('court_id', 'in', 
        supabase.from('courts').select('id')
      );

    if (invalidCourtCases > 0) {
      console.log(`\n📊 Found ${invalidCourtCases} cases with invalid court references`);
      
      // Set court_id to null for cases with invalid court references
      const { error: fixCourtError } = await supabase
        .from('cases')
        .update({ court_id: null })
        .not('court_id', 'in', 
          supabase.from('courts').select('id')
        );

      if (fixCourtError) {
        console.error('❌ Error fixing invalid court references:', fixCourtError);
      } else {
        console.log(`✅ Fixed ${invalidCourtCases} cases with invalid court references`);
      }
    }

    // Final count
    const { count: remainingCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Remaining cases in database: ${remainingCases}`);

  } catch (error) {
    console.error('💥 Error fixing orphaned cases:', error);
  }
}

fixOrphanedCases().then(() => {
  console.log('\n✅ Orphaned cases fix completed!');
  process.exit(0);
});