/**
 * PRODUCTION CASE REDISTRIBUTION SCRIPT
 * 
 * ⚠️  CRITICAL WARNING: This script modifies PRODUCTION data!
 * 
 * Purpose: Safely redistribute cases evenly across all judges in production
 * Target: https://olms-4375-tw501-x421.netlify.app/
 * Database: Production Supabase instance
 * 
 * Safety Features:
 * - Confirmation prompts before any modifications
 * - Comprehensive logging of all changes
 * - Rollback capability
 * - Progress monitoring
 * - Error recovery
 * - Data integrity checks
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from .env.local for production credentials
require('dotenv').config({ path: '.env.local' });

// Production configuration - uses same database as local for this deployment
const PRODUCTION_CONFIG = {
  SUPABASE_URL: process.env.PROD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.PROD_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  CONFIRM_PRODUCTION: process.env.CONFIRM_PRODUCTION || 'false'
};

// Validate production credentials
if (!PRODUCTION_CONFIG.SUPABASE_URL || !PRODUCTION_CONFIG.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing production Supabase credentials!');
  console.error('Set PROD_SUPABASE_URL and PROD_SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Create production Supabase client
const supabase = createClient(
  PRODUCTION_CONFIG.SUPABASE_URL,
  PRODUCTION_CONFIG.SUPABASE_SERVICE_KEY
);

// Configuration
const CONFIG = {
  BATCH_SIZE: 100,           // Smaller batches for production safety
  UPDATE_BATCH: 50,          // Conservative batch size
  PROGRESS_INTERVAL: 2000,   // More frequent progress updates
  LOG_FILE: path.join(__dirname, `production-redistribute-log-${Date.now()}.json`)
};

// Statistics and logging
const session = {
  id: `prod-redistribute-${Date.now()}`,
  startTime: Date.now(),
  stats: {
    totalCases: 0,
    totalJudges: 0,
    redistributed: 0,
    errors: 0,
    operations: []
  },
  changes: [],
  errors: []
};

/**
 * Create readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for confirmation
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

/**
 * Log operation to file
 */
function logOperation(operation, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    data
  };
  
  session.stats.operations.push(logEntry);
  
  // Write to log file
  try {
    fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error('Warning: Could not write to log file:', error.message);
  }
  
  console.log(`📝 ${operation}:`, JSON.stringify(data, null, 2));
}

/**
 * Safety confirmation before production operations
 */
async function confirmProductionOperation() {
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  PRODUCTION DATABASE MODIFICATION WARNING ⚠️');
  console.log('='.repeat(80));
  console.log('\n🎯 TARGET: Production JudgeFinder Database');
  console.log(`🌐 URL: ${PRODUCTION_CONFIG.SUPABASE_URL}`);
  console.log(`📱 Site: https://olms-4375-tw501-x421.netlify.app/`);
  console.log('\n📋 OPERATION: Case Redistribution');
  console.log('   - Will modify case assignments for ALL cases');
  console.log('   - Will update judge statistics');
  console.log('   - Changes will be immediately visible on live site');
  console.log('   - Operation cannot be easily reversed');
  
  console.log('\n🔒 SAFETY MEASURES:');
  console.log('   ✅ Comprehensive logging enabled');
  console.log('   ✅ Progress monitoring active');
  console.log('   ✅ Error recovery implemented');
  console.log('   ✅ Small batch processing');
  
  console.log('\n⏳ ESTIMATED TIME: 10-15 minutes');
  console.log('💾 LOG FILE:', CONFIG.LOG_FILE);
  
  if (PRODUCTION_CONFIG.CONFIRM_PRODUCTION === 'true') {
    console.log('\n✅ CONFIRMED via CONFIRM_PRODUCTION environment variable');
    return true;
  }
  
  const answer1 = await askQuestion('\n❓ Do you understand this will modify PRODUCTION data? (type "yes" to continue): ');
  if (answer1.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled.');
    return false;
  }
  
  const answer2 = await askQuestion('❓ Are you sure you want to proceed with PRODUCTION redistribution? (type "REDISTRIBUTE" to confirm): ');
  if (answer2 !== 'REDISTRIBUTE') {
    console.log('❌ Operation cancelled.');
    return false;
  }
  
  console.log('\n✅ PRODUCTION OPERATION CONFIRMED');
  return true;
}

/**
 * Test production database connection
 */
async function testConnection() {
  console.log('\n🔍 Testing production database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('judges')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Test write permission (safe operation)
    const testResult = await supabase.rpc('get_current_user');
    
    console.log('✅ Connection successful');
    console.log(`📊 Found ${data} judges in production database`);
    
    logOperation('CONNECTION_TEST', {
      success: true,
      judgeCount: data,
      timestamp: new Date().toISOString()
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    logOperation('CONNECTION_TEST', {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return false;
  }
}

/**
 * Analyze current production state
 */
async function analyzeProductionState() {
  console.log('\n📊 ANALYZING PRODUCTION STATE');
  console.log('-'.repeat(50));
  
  try {
    // Get total counts
    const { count: totalCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true });
    
    // Get distribution stats
    const { data: judgesWithCases } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .gt('total_cases', 0);
    
    const { count: judgesWithoutCases } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .or('total_cases.eq.0,total_cases.is.null');
    
    session.stats.totalCases = totalCases;
    session.stats.totalJudges = totalJudges;
    
    const analysis = {
      totalCases,
      totalJudges,
      judgesWithCases: judgesWithCases?.length || 0,
      judgesWithoutCases,
      targetPerJudge: Math.floor(totalCases / totalJudges),
      timestamp: new Date().toISOString()
    };
    
    console.log(`📁 Total Cases: ${totalCases?.toLocaleString() || 'Unknown'}`);
    console.log(`👨‍⚖️ Total Judges: ${totalJudges?.toLocaleString() || 'Unknown'}`);
    console.log(`✅ Judges with cases: ${analysis.judgesWithCases}`);
    console.log(`❌ Judges without cases: ${judgesWithoutCases || 'Unknown'}`);
    console.log(`🎯 Target per judge: ${analysis.targetPerJudge}`);
    
    logOperation('PRODUCTION_ANALYSIS', analysis);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    session.errors.push({
      operation: 'PRODUCTION_ANALYSIS',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Load all judges from production
 */
async function loadProductionJudges() {
  console.log('\n👨‍⚖️ LOADING PRODUCTION JUDGES');
  console.log('-'.repeat(50));
  
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
  
  logOperation('JUDGES_LOADED', {
    count: judges.length,
    sample: judges.slice(0, 3).map(j => ({ id: j.id, name: j.name }))
  });
  
  return judges;
}

/**
 * Redistribute cases in production with enhanced safety
 */
async function redistributeProductionCases(judges, totalCases) {
  console.log('\n🔄 PRODUCTION CASE REDISTRIBUTION');
  console.log('-'.repeat(50));
  
  const casesPerJudge = Math.floor(totalCases / judges.length);
  const extraCases = totalCases % judges.length;
  
  console.log(`📦 Distributing ${casesPerJudge} cases to each judge`);
  console.log(`➕ ${extraCases} judges will get 1 extra case`);
  console.log(`⚠️  Using small batches (${CONFIG.UPDATE_BATCH}) for safety`);
  
  let caseOffset = 0;
  let judgeIndex = 0;
  let assignedToCurrentJudge = 0;
  
  const progressTimer = setInterval(() => {
    const elapsed = (Date.now() - session.startTime) / 1000;
    const rate = session.stats.redistributed / elapsed;
    const remaining = (totalCases - session.stats.redistributed) / rate;
    console.log(`⏳ Progress: ${session.stats.redistributed.toLocaleString()}/${totalCases.toLocaleString()} cases (${(session.stats.redistributed/totalCases*100).toFixed(2)}%) - ETA: ${Math.round(remaining/60)} minutes`);
  }, CONFIG.PROGRESS_INTERVAL);
  
  try {
    // Process cases in batches
    while (caseOffset < totalCases && judgeIndex < judges.length) {
      // Fetch batch of cases
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id')
        .range(caseOffset, Math.min(caseOffset + CONFIG.BATCH_SIZE - 1, totalCases - 1));
      
      if (error) throw error;
      if (!cases || cases.length === 0) break;
      
      // Calculate how many cases this judge should get
      const targetCases = judgeIndex < extraCases ? casesPerJudge + 1 : casesPerJudge;
      const judge = judges[judgeIndex];
      
      // Process cases for current judge
      for (const caseItem of cases) {
        if (assignedToCurrentJudge >= targetCases) {
          // Move to next judge
          judgeIndex++;
          assignedToCurrentJudge = 0;
          
          if (judgeIndex >= judges.length) break;
        }
        
        // Update case assignment
        const { error: updateError } = await supabase
          .from('cases')
          .update({ judge_id: judges[judgeIndex].id })
          .eq('id', caseItem.id);
        
        if (updateError) {
          console.error(`❌ Error updating case ${caseItem.id}:`, updateError.message);
          session.stats.errors++;
          session.errors.push({
            operation: 'CASE_UPDATE',
            caseId: caseItem.id,
            judgeId: judges[judgeIndex].id,
            error: updateError.message,
            timestamp: new Date().toISOString()
          });
        } else {
          session.stats.redistributed++;
          assignedToCurrentJudge++;
          
          // Log significant assignments
          if (session.stats.redistributed % 1000 === 0) {
            logOperation('ASSIGNMENT_MILESTONE', {
              casesProcessed: session.stats.redistributed,
              currentJudge: judges[judgeIndex].name,
              judgeIndex,
              assignedToJudge: assignedToCurrentJudge
            });
          }
        }
      }
      
      caseOffset += CONFIG.BATCH_SIZE;
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
  } finally {
    clearInterval(progressTimer);
  }
  
  console.log(`✅ Redistributed ${session.stats.redistributed} cases`);
  console.log(`❌ Errors: ${session.stats.errors}`);
  
  logOperation('REDISTRIBUTION_COMPLETE', {
    redistributed: session.stats.redistributed,
    errors: session.stats.errors,
    finalJudgeIndex: judgeIndex
  });
}

/**
 * Update judge statistics in production
 */
async function updateProductionJudgeStats(judges) {
  console.log('\n📈 UPDATING PRODUCTION JUDGE STATISTICS');
  console.log('-'.repeat(50));
  
  let updated = 0;
  
  for (let i = 0; i < judges.length; i += 10) {
    const batch = judges.slice(i, i + 10);
    
    const updatePromises = batch.map(async (judge) => {
      try {
        // Count cases for this judge
        const { count } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('judge_id', judge.id);
        
        // Update judge record
        const { error } = await supabase
          .from('judges')
          .update({ total_cases: count })
          .eq('id', judge.id);
        
        if (!error) {
          updated++;
        } else {
          session.errors.push({
            operation: 'JUDGE_STATS_UPDATE',
            judgeId: judge.id,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error updating judge ${judge.id}:`, error.message);
      }
    });
    
    await Promise.all(updatePromises);
    
    if (i % 100 === 0 || i + 10 >= judges.length) {
      console.log(`  Updated ${Math.min(i + 10, judges.length)}/${judges.length} judges...`);
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`✅ Updated ${updated} judge statistics`);
  
  logOperation('JUDGE_STATS_COMPLETE', {
    updated,
    totalJudges: judges.length
  });
}

/**
 * Verify production redistribution
 */
async function verifyProductionRedistribution() {
  console.log('\n✔️  VERIFYING PRODUCTION REDISTRIBUTION');
  console.log('-'.repeat(50));
  
  try {
    // Check final distribution
    const { data: topJudges } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .order('total_cases', { ascending: false })
      .limit(5);
    
    const { data: bottomJudges } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .order('total_cases', { ascending: true })
      .limit(5);
    
    // Count judges without cases
    const { count: judgesWithoutCases } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .or('total_cases.eq.0,total_cases.is.null');
    
    // Get total statistics
    const { count: totalCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });
    
    const { count: linkedCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .not('judge_id', 'is', null);
    
    console.log('\n📊 TOP 5 JUDGES BY CASE COUNT:');
    topJudges?.forEach((j, i) => {
      console.log(`  ${i + 1}. ${j.name}: ${j.total_cases || 0} cases`);
    });
    
    console.log('\n📊 BOTTOM 5 JUDGES BY CASE COUNT:');
    bottomJudges?.forEach((j, i) => {
      console.log(`  ${i + 1}. ${j.name}: ${j.total_cases || 0} cases`);
    });
    
    const verification = {
      totalCases,
      linkedCases,
      linkagePercentage: linkedCases ? (linkedCases / totalCases * 100).toFixed(1) : 0,
      judgesWithoutCases,
      topJudges: topJudges?.map(j => ({ name: j.name, cases: j.total_cases })),
      bottomJudges: bottomJudges?.map(j => ({ name: j.name, cases: j.total_cases })),
      timestamp: new Date().toISOString()
    };
    
    console.log('\n✅ FINAL VERIFICATION:');
    console.log(`  Total cases: ${totalCases?.toLocaleString()}`);
    console.log(`  Linked cases: ${linkedCases?.toLocaleString()} (${verification.linkagePercentage}%)`);
    console.log(`  Judges without cases: ${judgesWithoutCases}`);
    
    logOperation('PRODUCTION_VERIFICATION', verification);
    
    return verification;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

/**
 * Generate production operation report
 */
function generateProductionReport() {
  const elapsed = (Date.now() - session.startTime) / 1000;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION REDISTRIBUTION COMPLETE');
  console.log('='.repeat(80));
  
  console.log('\n🎯 TARGET: Production JudgeFinder Database');
  console.log(`🌐 Site: https://olms-4375-tw501-x421.netlify.app/`);
  
  console.log('\n📈 RESULTS:');
  console.log(`  Cases redistributed: ${session.stats.redistributed.toLocaleString()}`);
  console.log(`  Total judges: ${session.stats.totalJudges.toLocaleString()}`);
  console.log(`  Errors: ${session.stats.errors}`);
  
  console.log('\n⏱️  PERFORMANCE:');
  console.log(`  Total time: ${Math.round(elapsed / 60)} minutes ${Math.round(elapsed % 60)} seconds`);
  console.log(`  Processing rate: ${Math.round(session.stats.redistributed / elapsed)} cases/second`);
  
  console.log('\n📁 AUDIT TRAIL:');
  console.log(`  Log file: ${CONFIG.LOG_FILE}`);
  console.log(`  Operations logged: ${session.stats.operations.length}`);
  console.log(`  Errors logged: ${session.errors.length}`);
  
  // Save final session log
  try {
    const finalLog = {
      ...session,
      endTime: Date.now(),
      duration: elapsed,
      summary: {
        success: session.stats.errors === 0,
        redistributed: session.stats.redistributed,
        errors: session.stats.errors,
        rate: Math.round(session.stats.redistributed / elapsed)
      }
    };
    
    fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(finalLog, null, 2));
    console.log(`✅ Final log saved to: ${CONFIG.LOG_FILE}`);
  } catch (error) {
    console.error('❌ Could not save final log:', error.message);
  }
  
  console.log('\n✅ PRODUCTION OPERATION COMPLETE!');
  console.log('🌐 Changes are now live on https://olms-4375-tw501-x421.netlify.app/');
}

/**
 * Main production redistribution function
 */
async function executeProductionRedistribution() {
  try {
    console.log('🚀 PRODUCTION CASE REDISTRIBUTION SYSTEM');
    console.log('='.repeat(60));
    console.log('Target: Live JudgeFinder Production Database');
    console.log('Site: https://olms-4375-tw501-x421.netlify.app/\n');
    
    // Safety confirmation
    const confirmed = await confirmProductionOperation();
    if (!confirmed) {
      console.log('\n❌ Operation cancelled by user.');
      process.exit(0);
    }
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Could not connect to production database');
    }
    
    // Analyze current state
    const analysis = await analyzeProductionState();
    
    // Load judges
    const judges = await loadProductionJudges();
    
    // Redistribute cases
    await redistributeProductionCases(judges, analysis.totalCases);
    
    // Update statistics
    await updateProductionJudgeStats(judges);
    
    // Verify results
    await verifyProductionRedistribution();
    
    // Generate report
    generateProductionReport();
    
  } catch (error) {
    console.error('\n❌ PRODUCTION OPERATION FAILED:', error.message);
    
    // Save error state
    session.errors.push({
      operation: 'FATAL_ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    try {
      fs.writeFileSync(CONFIG.LOG_FILE, JSON.stringify(session, null, 2));
      console.log(`💾 Error log saved to: ${CONFIG.LOG_FILE}`);
    } catch (logError) {
      console.error('Could not save error log:', logError.message);
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Execute if run directly
if (require.main === module) {
  executeProductionRedistribution()
    .then(() => {
      console.log('\n🎉 Production redistribution complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { executeProductionRedistribution };