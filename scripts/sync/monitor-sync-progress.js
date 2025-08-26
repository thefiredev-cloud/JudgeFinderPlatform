const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitorProgress() {
  console.log('\n📊 SYNC PROGRESS MONITOR');
  console.log('=' .repeat(60));
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  try {
    // Check judges count
    const { count: judgesCount } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true });
    
    // Check CA judges with cases
    const { data: caJudgesWithCases } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', 'CA')
      .gte('total_cases', 500)
      .limit(5);
    
    const { count: caJudgesWithCasesCount } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
      .gte('total_cases', 500);

    // Check courts count
    const { count: courtsCount } = await supabase
      .from('courts')
      .select('*', { count: 'exact', head: true });

    // Check cases count
    const { count: casesCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    // Check recent cases added (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: recentCasesCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo);

    // Display results
    console.log('📈 DATABASE STATISTICS:');
    console.log(`  • Total Judges: ${judgesCount?.toLocaleString() || 0}`);
    console.log(`  • Total Courts: ${courtsCount?.toLocaleString() || 0}`);
    console.log(`  • Total Cases: ${casesCount?.toLocaleString() || 0}`);
    console.log(`  • CA Judges with 500+ cases: ${caJudgesWithCasesCount || 0} / 1000`);
    console.log(`  • Cases added in last 5 min: ${recentCasesCount?.toLocaleString() || 0}`);
    
    // Calculate progress percentage
    const caProgress = ((caJudgesWithCasesCount || 0) / 1000) * 100;
    console.log(`\n📊 CA JUDGES PROGRESS: ${caProgress.toFixed(1)}%`);
    
    // Progress bar
    const barLength = 50;
    const filledLength = Math.round((caProgress / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`  [${bar}] ${caJudgesWithCasesCount}/1000`);
    
    // Sample judges with cases
    if (caJudgesWithCases && caJudgesWithCases.length > 0) {
      console.log('\n👨‍⚖️ SAMPLE JUDGES WITH 500+ CASES:');
      caJudgesWithCases.forEach(judge => {
        console.log(`  • ${judge.name}: ${judge.total_cases} cases`);
      });
    }
    
    // Estimate completion time
    if (recentCasesCount > 0) {
      const casesPerMinute = recentCasesCount / 5;
      const remainingJudges = 1000 - (caJudgesWithCasesCount || 0);
      const remainingCases = remainingJudges * 500;
      const minutesRemaining = remainingCases / casesPerMinute;
      const hoursRemaining = Math.ceil(minutesRemaining / 60);
      
      console.log('\n⏱️ ESTIMATED COMPLETION:');
      console.log(`  • Cases per minute: ${Math.round(casesPerMinute)}`);
      console.log(`  • Remaining judges: ${remainingJudges}`);
      console.log(`  • Estimated time: ${hoursRemaining} hours`);
    }
    
    // Check for any errors in recent sync
    const { data: judgesWithZeroCases } = await supabase
      .from('judges')
      .select('name')
      .eq('jurisdiction', 'CA')
      .eq('total_cases', 0)
      .limit(3);
    
    if (judgesWithZeroCases && judgesWithZeroCases.length > 0) {
      console.log('\n⚠️ CA JUDGES STILL NEEDING CASES:');
      console.log(`  ${judgesWithZeroCases.length} judges with 0 cases`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Monitoring complete. Run again to check updated progress.');
    
  } catch (error) {
    console.error('❌ Error checking progress:', error.message);
  }
}

// Run the monitor
monitorProgress();

// Optional: Set up continuous monitoring
if (process.argv.includes('--watch')) {
  console.log('📡 Starting continuous monitoring (updates every 2 minutes)...');
  setInterval(monitorProgress, 120000); // Every 2 minutes
}