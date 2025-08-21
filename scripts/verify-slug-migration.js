const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySlugMigration() {
  try {
    console.log('🔍 Verifying judge slug migration...');
    
    // Check if slug column exists
    const { data: judgeData, error: judgeError } = await supabase
      .from('judges')
      .select('id, name, slug')
      .limit(5);
    
    if (judgeError) {
      console.error('❌ Error fetching judges:', judgeError.message);
      return false;
    }
    
    console.log('✅ Judge table accessible');
    console.log('📊 Sample judges:', judgeData.map(j => ({ 
      id: j.id, 
      name: j.name, 
      slug: j.slug 
    })));
    
    // Check total judges and slug statistics
    const { data: countData, error: countError } = await supabase
      .from('judges')
      .select('id, slug')
      .not('slug', 'is', null);
    
    if (countError) {
      console.error('❌ Error counting judges with slugs:', countError.message);
      return false;
    }
    
    const judgesWithSlugs = countData.length;
    
    // Get total judges count
    const { data: totalData, error: totalError } = await supabase
      .from('judges')
      .select('id');
    
    if (totalError) {
      console.error('❌ Error counting total judges:', totalError.message);
      return false;
    }
    
    const totalJudges = totalData.length;
    
    console.log(`📊 Total judges: ${totalJudges}`);
    console.log(`📊 Judges with slugs: ${judgesWithSlugs}`);
    console.log(`📊 Slug completion: ${((judgesWithSlugs / totalJudges) * 100).toFixed(1)}%`);
    
    if (judgesWithSlugs === totalJudges) {
      console.log('🎉 All judges have slugs - migration is complete!');
      return true;
    } else if (judgesWithSlugs > 0) {
      console.log('⚠️  Some judges missing slugs - may need to run slug generation');
      
      // Show sample judges without slugs
      const { data: missingSlugs, error: missingError } = await supabase
        .from('judges')
        .select('id, name, slug')
        .is('slug', null)
        .limit(5);
      
      if (!missingError && missingSlugs.length > 0) {
        console.log('📝 Sample judges without slugs:', missingSlugs.map(j => j.name));
      }
      
      return false;
    } else {
      console.log('❌ No judges have slugs - migration not applied');
      return false;
    }
    
  } catch (error) {
    console.error('🚨 Error verifying slug migration:', error.message);
    return false;
  }
}

verifySlugMigration().then(success => {
  if (success) {
    console.log('✅ Slug migration verification passed');
  } else {
    console.log('⚠️  Slug migration needs attention');
  }
  process.exit(success ? 0 : 1);
});