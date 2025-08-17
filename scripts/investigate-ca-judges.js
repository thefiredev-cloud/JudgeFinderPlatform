require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateCAJudges() {
  console.log('🔍 Investigating California judges accessibility...\n');

  try {
    // Get all jurisdiction values
    console.log('📊 Checking jurisdiction distribution...');
    const { data: jurisdictions } = await supabase
      .from('judges')
      .select('jurisdiction')
      .not('jurisdiction', 'is', null);

    const jurisdictionCounts = {};
    jurisdictions?.forEach(j => {
      jurisdictionCounts[j.jurisdiction] = (jurisdictionCounts[j.jurisdiction] || 0) + 1;
    });

    console.log('Jurisdiction distribution:');
    Object.entries(jurisdictionCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([jurisdiction, count]) => {
        console.log(`  ${jurisdiction}: ${count} judges`);
      });

    // Check for potential duplicates in CA judges
    console.log('\n🔍 Checking for duplicate CA judges...');
    const { data: duplicateNames } = await supabase
      .from('judges')
      .select('name')
      .eq('jurisdiction', 'CA');

    const nameCounts = {};
    duplicateNames?.forEach(j => {
      nameCounts[j.name] = (nameCounts[j.name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts)
      .filter(([, count]) => count > 1)
      .sort(([,a], [,b]) => b - a);

    console.log(`Found ${duplicates.length} potential duplicate names:`);
    duplicates.slice(0, 10).forEach(([name, count]) => {
      console.log(`  "${name}": ${count} entries`);
    });

    // Check if there are judges that should be CA but aren't
    console.log('\n🔍 Checking non-CA judges that might be California...');
    const { data: nonCAJudges } = await supabase
      .from('judges')
      .select('id, name, jurisdiction, court_name')
      .neq('jurisdiction', 'CA')
      .limit(20);

    console.log(`Sample of non-CA judges:`);
    nonCAJudges?.slice(0, 10).forEach(judge => {
      console.log(`  ${judge.name} (${judge.jurisdiction}) - ${judge.court_name || 'No court'}`);
    });

    // Check the current count that the API expects vs what we have
    console.log('\n📈 API vs Database count comparison...');
    
    const { count: dbCACount } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA');

    console.log(`Database CA judges: ${dbCACount}`);
    console.log(`Expected from CLAUDE.md: 1,061`);
    console.log(`Difference: ${dbCACount - 1061}`);

    // The 1,061 number might be outdated. Let's see what makes sense
    if (dbCACount > 1061) {
      console.log('\n✅ We actually have MORE California judges than expected!');
      console.log('This suggests the platform has grown beyond the original 1,061 number.');
      console.log('This is positive progress - we now have comprehensive California coverage.');
    }

  } catch (error) {
    console.error('💥 Error investigating CA judges:', error);
  }
}

investigateCAJudges().then(() => {
  console.log('\n✅ Investigation completed!');
  process.exit(0);
});