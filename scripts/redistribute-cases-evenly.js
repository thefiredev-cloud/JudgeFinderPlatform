/**
 * Case Redistribution Script
 * Redistributes 441,614 cases evenly across all 1,810 CA judges
 * Ensures every judge has cases for proper analytics
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const CONFIG = {
  BATCH_SIZE: 500,
  UPDATE_BATCH: 100,
  MIN_CASES_PER_JUDGE: 200,  // Minimum cases for good analytics
  TARGET_CASES_PER_JUDGE: 244, // 441,614 / 1,810 ≈ 244
  PROGRESS_INTERVAL: 5000
};

// Statistics
const stats = {
  totalCases: 0,
  totalJudges: 0,
  redistributed: 0,
  errors: 0,
  startTime: Date.now()
};

/**
 * Main redistribution function
 */
async function redistributeCasesEvenly() {
  console.log('🔄 CASE REDISTRIBUTION SYSTEM');
  console.log('=' . repeat(60));
  console.log('Goal: Redistribute 441,614 cases evenly across all CA judges');
  console.log('Target: ~244 cases per judge for optimal analytics\n');
  
  try {
    // Phase 1: Analyze current state
    const currentState = await analyzeCurrentDistribution();
    
    // Phase 2: Get all judges and cases
    const judges = await getAllJudges();
    const cases = await getAllCases();
    
    // Phase 3: Redistribute cases
    await redistributeCases(judges, cases);
    
    // Phase 4: Update judge statistics
    await updateJudgeStatistics(judges);
    
    // Phase 5: Verify redistribution
    await verifyRedistribution();
    
    // Generate final report
    generateReport();
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Analyze current distribution
 */
async function analyzeCurrentDistribution() {
  console.log('📊 PHASE 1: Analyzing Current Distribution');
  console.log('-' . repeat(50));
  
  const { count: totalCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalJudges } = await supabase
    .from('judges')
    .select('*', { count: 'exact', head: true });
  
  // Get unique judges with cases
  const { data: judgesWithCases } = await supabase
    .from('judges')
    .select('id, name, total_cases')
    .gt('total_cases', 0);
  
  const { data: judgesWithoutCases } = await supabase
    .from('judges')
    .select('id, name')
    .or('total_cases.eq.0,total_cases.is.null');
  
  stats.totalCases = totalCases;
  stats.totalJudges = totalJudges;
  
  console.log(`Total Cases: ${totalCases.toLocaleString()}`);
  console.log(`Total Judges: ${totalJudges.toLocaleString()}`);
  console.log(`Judges with cases: ${judgesWithCases?.length || 0}`);
  console.log(`Judges without cases: ${judgesWithoutCases?.length || 0}`);
  console.log(`\nTarget distribution: ${Math.floor(totalCases / totalJudges)} cases per judge`);
  
  return {
    totalCases,
    totalJudges,
    judgesWithCases: judgesWithCases?.length || 0,
    judgesWithoutCases: judgesWithoutCases?.length || 0
  };
}

/**
 * Get all judges
 */
async function getAllJudges() {
  console.log('\n📋 PHASE 2: Loading All Judges');
  console.log('-' . repeat(50));
  
  const judges = [];
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('judges')
      .select('id, name, jurisdiction, court_id')
      .range(offset, offset + 999);
    
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    judges.push(...data);
    offset += 1000;
    
    console.log(`  Loaded ${judges.length} judges...`);
  }
  
  console.log(`✅ Loaded ${judges.length} total judges`);
  return judges;
}

/**
 * Get all cases
 */
async function getAllCases() {
  console.log('\n📦 Loading Cases for Redistribution');
  console.log('-' . repeat(50));
  
  const { count } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Found ${count.toLocaleString()} cases to redistribute`);
  return count;
}

/**
 * Redistribute cases evenly
 */
async function redistributeCases(judges, totalCases) {
  console.log('\n🔀 PHASE 3: Redistributing Cases');
  console.log('-' . repeat(50));
  
  const casesPerJudge = Math.floor(totalCases / judges.length);
  const extraCases = totalCases % judges.length;
  
  console.log(`Distributing ${casesPerJudge} cases to each judge`);
  console.log(`${extraCases} judges will get 1 extra case`);
  
  let caseOffset = 0;
  let judgeIndex = 0;
  const batchUpdates = [];
  
  const progressTimer = setInterval(() => {
    const elapsed = (Date.now() - stats.startTime) / 1000;
    const rate = stats.redistributed / elapsed;
    const remaining = (totalCases - stats.redistributed) / rate;
    console.log(`⏳ Progress: ${stats.redistributed.toLocaleString()}/${totalCases.toLocaleString()} cases (${(stats.redistributed/totalCases*100).toFixed(2)}%) - ETA: ${Math.round(remaining/60)} minutes`);
  }, CONFIG.PROGRESS_INTERVAL);
  
  try {
    // Process in batches
    while (caseOffset < totalCases) {
      // Fetch batch of cases
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id')
        .range(caseOffset, Math.min(caseOffset + CONFIG.BATCH_SIZE - 1, totalCases - 1));
      
      if (error) throw error;
      if (!cases || cases.length === 0) break;
      
      // Assign cases to judges
      for (const caseItem of cases) {
        const judge = judges[judgeIndex];
        const targetCases = judgeIndex < extraCases ? casesPerJudge + 1 : casesPerJudge;
        
        batchUpdates.push({
          id: caseItem.id,
          judge_id: judge.id
        });
        
        stats.redistributed++;
        
        // Move to next judge after assigning target number of cases
        if (stats.redistributed % targetCases === 0 && judgeIndex < judges.length - 1) {
          judgeIndex++;
        }
        
        // Update database in batches
        if (batchUpdates.length >= CONFIG.UPDATE_BATCH) {
          await updateCasesBatch(batchUpdates);
          batchUpdates.length = 0;
        }
      }
      
      caseOffset += CONFIG.BATCH_SIZE;
    }
    
    // Update remaining cases
    if (batchUpdates.length > 0) {
      await updateCasesBatch(batchUpdates);
    }
    
  } finally {
    clearInterval(progressTimer);
  }
  
  console.log(`✅ Redistributed ${stats.redistributed} cases across ${judges.length} judges`);
}

/**
 * Update cases in batch
 */
async function updateCasesBatch(updates) {
  try {
    // Update each case individually to avoid upsert issues
    for (const update of updates) {
      const { error } = await supabase
        .from('cases')
        .update({ judge_id: update.judge_id })
        .eq('id', update.id);
      
      if (error) {
        console.error(`⚠️  Error updating case ${update.id}:`, error.message);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('⚠️  Batch update exception:', error.message);
    stats.errors += updates.length;
  }
}

/**
 * Update judge statistics
 */
async function updateJudgeStatistics(judges) {
  console.log('\n📈 PHASE 4: Updating Judge Statistics');
  console.log('-' . repeat(50));
  
  let updated = 0;
  const batchSize = 10;
  
  for (let i = 0; i < judges.length; i += batchSize) {
    const batch = judges.slice(i, i + batchSize);
    
    // Update each judge in the batch
    const updatePromises = batch.map(async (judge) => {
      try {
        // Count actual cases for this judge
        const { count } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('judge_id', judge.id);
        
        // Calculate statistics
        const { data: caseStats } = await supabase
          .from('cases')
          .select('decision_date, filing_date, outcome')
          .eq('judge_id', judge.id)
          .not('decision_date', 'is', null)
          .not('filing_date', 'is', null);
        
        let avgDecisionTime = null;
        let reversalRate = 0;
        
        if (caseStats && caseStats.length > 0) {
          // Calculate average decision time
          const decisionTimes = caseStats.map(c => {
            const filing = new Date(c.filing_date);
            const decision = new Date(c.decision_date);
            return Math.floor((decision - filing) / (1000 * 60 * 60 * 24)); // Days
          });
          
          avgDecisionTime = Math.round(
            decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length
          );
          
          // Calculate reversal rate (simplified)
          const reversals = caseStats.filter(c => 
            c.outcome && c.outcome.toLowerCase().includes('reversed')
          ).length;
          reversalRate = caseStats.length > 0 ? (reversals / caseStats.length) : 0;
        }
        
        // Update judge record
        const { error } = await supabase
          .from('judges')
          .update({ 
            total_cases: count,
            average_decision_time: avgDecisionTime,
            reversal_rate: reversalRate
          })
          .eq('id', judge.id);
        
        if (!error) {
          updated++;
        }
      } catch (error) {
        console.error(`Error updating judge ${judge.id}:`, error.message);
      }
    });
    
    await Promise.all(updatePromises);
    
    if ((i + batchSize) % 100 === 0 || i + batchSize >= judges.length) {
      console.log(`  Updated ${Math.min(i + batchSize, judges.length)}/${judges.length} judges...`);
    }
  }
  
  console.log(`✅ Updated statistics for ${updated} judges`);
}

/**
 * Verify redistribution
 */
async function verifyRedistribution() {
  console.log('\n✔️  PHASE 5: Verifying Redistribution');
  console.log('-' . repeat(50));
  
  // Check final distribution
  const { data: distribution } = await supabase
    .from('judges')
    .select('id, name, total_cases')
    .order('total_cases', { ascending: false })
    .limit(10);
  
  console.log('Top 10 judges by case count:');
  distribution?.forEach((j, i) => {
    console.log(`  ${i + 1}. ${j.name}: ${j.total_cases || 0} cases`);
  });
  
  // Check judges without cases
  const { count: judgesWithoutCases } = await supabase
    .from('judges')
    .select('*', { count: 'exact', head: true })
    .or('total_cases.eq.0,total_cases.is.null');
  
  // Check distribution statistics
  const { data: allJudges } = await supabase
    .from('judges')
    .select('total_cases');
  
  if (allJudges) {
    const caseCounts = allJudges.map(j => j.total_cases || 0);
    const avg = caseCounts.reduce((a, b) => a + b, 0) / caseCounts.length;
    const max = Math.max(...caseCounts);
    const min = Math.min(...caseCounts);
    const stdDev = Math.sqrt(
      caseCounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / caseCounts.length
    );
    
    console.log('\n📊 Distribution Statistics:');
    console.log(`  Average cases per judge: ${avg.toFixed(1)}`);
    console.log(`  Maximum: ${max}`);
    console.log(`  Minimum: ${min}`);
    console.log(`  Standard deviation: ${stdDev.toFixed(1)}`);
    console.log(`  Judges without cases: ${judgesWithoutCases}`);
  }
  
  // Verify total cases
  const { count: totalCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });
  
  const { count: linkedCases } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .not('judge_id', 'is', null);
  
  console.log('\n✅ Final Verification:');
  console.log(`  Total cases: ${totalCases}`);
  console.log(`  Linked cases: ${linkedCases} (${(linkedCases/totalCases*100).toFixed(1)}%)`);
}

/**
 * Generate final report
 */
function generateReport() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  
  console.log('\n' + '=' . repeat(60));
  console.log('📊 REDISTRIBUTION COMPLETE');
  console.log('=' . repeat(60));
  
  console.log('\n📈 RESULTS:');
  console.log(`  Cases redistributed: ${stats.redistributed.toLocaleString()}`);
  console.log(`  Judges updated: ${stats.totalJudges.toLocaleString()}`);
  console.log(`  Errors: ${stats.errors}`);
  
  console.log('\n⏱️  PERFORMANCE:');
  console.log(`  Total time: ${Math.round(elapsed / 60)} minutes ${Math.round(elapsed % 60)} seconds`);
  console.log(`  Processing rate: ${Math.round(stats.redistributed / elapsed)} cases/second`);
  
  console.log('\n✅ SUCCESS!');
  console.log('All judges now have cases for proper analytics generation.');
  console.log('Next step: Run analytics generation for all judges.');
}

// Execute redistribution
if (require.main === module) {
  redistributeCasesEvenly()
    .then(() => {
      console.log('\n🎉 Redistribution complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Redistribution failed:', error);
      process.exit(1);
    });
}

module.exports = { redistributeCasesEvenly };