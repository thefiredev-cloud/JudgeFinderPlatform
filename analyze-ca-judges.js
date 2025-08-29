/**
 * California Judges Analysis and Data Sync Script
 * Analyzes current CA judge data and identifies gaps for 500+ case requirement
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeCAJudges() {
  console.log('\n🔍 CALIFORNIA JUDGES DATABASE ANALYSIS');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get all California judges
    const { data: allJudges, error: judgeError } = await supabase
      .from('judges')
      .select('*')
      .or('jurisdiction.eq.CA,jurisdiction.ilike.%California%,court_name.ilike.%California%');
    
    if (judgeError) throw judgeError;
    
    const caJudges = allJudges || [];
    console.log(`\n📊 Total California Judges: ${caJudges.length}`);
    
    // 2. Get California courts
    const { data: caCourts, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .or('jurisdiction.ilike.%CA%,jurisdiction.ilike.%California%,name.ilike.%California%');
    
    if (courtError) throw courtError;
    
    console.log(`🏛️  Total California Courts: ${caCourts?.length || 0}`);
    
    // 3. Analyze case distribution for CA judges
    console.log('\n📈 CASE COUNT ANALYSIS:');
    console.log('-'.repeat(40));
    
    const judgeStats = [];
    
    for (const judge of caJudges) {
      // Count cases for this judge
      const { count, error } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', judge.id);
      
      if (!error) {
        judgeStats.push({
          id: judge.id,
          name: judge.name,
          caseCount: count || 0,
          courtName: judge.court_name,
          hasCourtlistenerId: !!judge.courtlistener_id
        });
      }
    }
    
    // Sort by case count
    judgeStats.sort((a, b) => b.caseCount - a.caseCount);
    
    // Calculate statistics
    const stats = {
      total: judgeStats.length,
      with500Plus: judgeStats.filter(j => j.caseCount >= 500).length,
      with300To499: judgeStats.filter(j => j.caseCount >= 300 && j.caseCount < 500).length,
      with100To299: judgeStats.filter(j => j.caseCount >= 100 && j.caseCount < 300).length,
      with1To99: judgeStats.filter(j => j.caseCount >= 1 && j.caseCount < 100).length,
      withZero: judgeStats.filter(j => j.caseCount === 0).length,
      withCourtlistenerId: judgeStats.filter(j => j.hasCourtlistenerId).length
    };
    
    console.log('\nCase Distribution:');
    console.log(`  ✅ 500+ cases: ${stats.with500Plus} judges (${(stats.with500Plus/stats.total*100).toFixed(1)}%)`);
    console.log(`  📊 300-499 cases: ${stats.with300To499} judges`);
    console.log(`  📈 100-299 cases: ${stats.with100To299} judges`);
    console.log(`  📉 1-99 cases: ${stats.with1To99} judges`);
    console.log(`  ❌ 0 cases: ${stats.withZero} judges (${(stats.withZero/stats.total*100).toFixed(1)}%)`);
    console.log(`  🔗 With CourtListener ID: ${stats.withCourtlistenerId} judges`);
    
    // Show top judges
    console.log('\n🏆 TOP 10 JUDGES BY CASE COUNT:');
    console.log('-'.repeat(40));
    judgeStats.slice(0, 10).forEach((judge, i) => {
      console.log(`${i + 1}. ${judge.name}`);
      console.log(`   Cases: ${judge.caseCount} | Court: ${judge.courtName || 'Unknown'}`);
    });
    
    // Show judges needing cases
    const needsCases = judgeStats.filter(j => j.caseCount < 500);
    console.log(`\n⚠️  JUDGES NEEDING MORE CASES: ${needsCases.length}`);
    
    if (needsCases.length > 0) {
      console.log('\nSample judges needing cases (bottom 10):');
      needsCases.slice(-10).forEach(judge => {
        console.log(`  - ${judge.name}: ${judge.caseCount} cases (needs ${500 - judge.caseCount} more)`);
      });
    }
    
    // 4. Check court-judge assignments
    const { count: assignmentCount, error: assignError } = await supabase
      .from('court_judge_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (!assignError) {
      console.log(`\n🔗 Total Court-Judge Assignments: ${assignmentCount}`);
    }
    
    // 5. Summary and recommendations
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    console.log(`✅ Judges meeting 500+ case requirement: ${stats.with500Plus}/${stats.total}`);
    console.log(`⚠️  Judges needing more cases: ${needsCases.length}`);
    console.log(`📊 Average cases per judge: ${Math.round(judgeStats.reduce((sum, j) => sum + j.caseCount, 0) / stats.total)}`);
    
    const completion = (stats.with500Plus / stats.total * 100).toFixed(1);
    console.log(`\n🎯 COMPLETION: ${completion}% of CA judges have 500+ cases`);
    
    if (needsCases.length > 0) {
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Run sync-judge-decisions.js to fetch more cases');
      console.log('2. Focus on judges with CourtListener IDs first');
      console.log('3. Generate AI analytics after reaching 500+ cases per judge');
    }
    
    // Save analysis results
    const report = {
      timestamp: new Date().toISOString(),
      totalCAJudges: stats.total,
      judgesWith500Plus: stats.with500Plus,
      completionPercentage: completion,
      needingMoreCases: needsCases.length,
      distribution: stats,
      topJudges: judgeStats.slice(0, 10).map(j => ({ name: j.name, cases: j.caseCount })),
      judgesNeedingCases: needsCases.map(j => ({ 
        id: j.id, 
        name: j.name, 
        currentCases: j.caseCount,
        casesNeeded: 500 - j.caseCount 
      }))
    };
    
    const fs = require('fs').promises;
    await fs.writeFile(
      'ca-judges-analysis.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n💾 Analysis saved to ca-judges-analysis.json');
    
    return report;
    
  } catch (error) {
    console.error('❌ Error analyzing CA judges:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  analyzeCAJudges()
    .then(() => {
      console.log('\n✅ Analysis complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeCAJudges };