/**
 * Final California Data Validation Script
 * Validates that all CA judges have 500+ cases and complete court information
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateCaliforniaData() {
  console.log('\n🔍 FINAL CALIFORNIA DATA VALIDATION');
  console.log('=' .repeat(70));
  console.log('Validating: All CA judges have 500+ cases and court information\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    totalJudges: 0,
    judgesWith500Plus: 0,
    judgesWithCourts: 0,
    judgesWithAnalytics: 0,
    totalCases: 0,
    totalCourts: 0,
    issues: [],
    success: false
  };
  
  try {
    // 1. Validate CA Judges
    console.log('📊 VALIDATING JUDGES...');
    const { data: judges, error: judgeError } = await supabase
      .from('judges')
      .select('*')
      .or('jurisdiction.eq.CA,jurisdiction.ilike.%California%,court_name.ilike.%California%');
    
    if (judgeError) throw judgeError;
    
    results.totalJudges = judges.length;
    console.log(`  Total CA Judges: ${judges.length}`);
    
    // Check each judge
    const judgeIssues = [];
    
    for (const judge of judges) {
      // Count cases
      const { count: caseCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('judge_id', judge.id);
      
      const cases = caseCount || 0;
      
      // Track statistics
      if (cases >= 500) {
        results.judgesWith500Plus++;
      } else {
        judgeIssues.push({
          judge: judge.name,
          cases: cases,
          needed: 500 - cases
        });
      }
      
      if (judge.court_id) {
        results.judgesWithCourts++;
      }
      
      if (judge.case_analytics) {
        results.judgesWithAnalytics++;
      }
      
      results.totalCases += cases;
    }
    
    console.log(`  ✅ Judges with 500+ cases: ${results.judgesWith500Plus}/${results.totalJudges}`);
    console.log(`  🏛️  Judges with court assignments: ${results.judgesWithCourts}/${results.totalJudges}`);
    console.log(`  🤖 Judges with AI analytics: ${results.judgesWithAnalytics}/${results.totalJudges}`);
    console.log(`  📁 Total cases: ${results.totalCases}`);
    console.log(`  📊 Average cases per judge: ${Math.round(results.totalCases / results.totalJudges)}`);
    
    if (judgeIssues.length > 0) {
      console.log(`\n  ⚠️  ${judgeIssues.length} judges need more cases:`);
      judgeIssues.slice(0, 5).forEach(issue => {
        console.log(`    - ${issue.judge}: ${issue.cases} cases (needs ${issue.needed} more)`);
      });
      if (judgeIssues.length > 5) {
        console.log(`    ... and ${judgeIssues.length - 5} more`);
      }
      results.issues.push(...judgeIssues.map(i => `Judge ${i.judge} needs ${i.needed} more cases`));
    }
    
    // 2. Validate CA Courts
    console.log('\n🏛️  VALIDATING COURTS...');
    const { data: courts, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .or('jurisdiction.ilike.%CA%,jurisdiction.ilike.%California%,name.ilike.%California%');
    
    if (courtError) throw courtError;
    
    results.totalCourts = courts.length;
    console.log(`  Total CA Courts: ${courts.length}`);
    
    // Expected CA courts (58 Superior Courts + 6 Appellate + 1 Supreme)
    const expectedCourts = 65;
    if (courts.length < expectedCourts) {
      results.issues.push(`Missing ${expectedCourts - courts.length} expected California courts`);
      console.log(`  ⚠️  Missing ${expectedCourts - courts.length} expected courts`);
    }
    
    // Check court statistics
    let courtsWithJudges = 0;
    let courtsWithCases = 0;
    
    for (const court of courts) {
      if (court.total_judges > 0) courtsWithJudges++;
      if (court.total_cases > 0) courtsWithCases++;
    }
    
    console.log(`  👨‍⚖️ Courts with judges: ${courtsWithJudges}/${courts.length}`);
    console.log(`  📁 Courts with cases: ${courtsWithCases}/${courts.length}`);
    
    // 3. Validate Court-Judge Relationships
    console.log('\n🔗 VALIDATING RELATIONSHIPS...');
    const { count: assignmentCount, error: assignError } = await supabase
      .from('court_judge_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (!assignError) {
      console.log(`  Court-Judge Assignments: ${assignmentCount}`);
      
      if (assignmentCount < results.totalJudges * 0.8) {
        results.issues.push(`Low court-judge assignment rate: ${assignmentCount}/${results.totalJudges}`);
        console.log(`  ⚠️  Low assignment rate (${Math.round(assignmentCount/results.totalJudges*100)}%)`);
      }
    }
    
    // 4. Calculate Success Metrics
    console.log('\n📈 SUCCESS METRICS:');
    console.log('=' .repeat(70));
    
    const metrics = {
      caseCompletion: (results.judgesWith500Plus / results.totalJudges * 100).toFixed(1),
      courtAssignment: (results.judgesWithCourts / results.totalJudges * 100).toFixed(1),
      analyticsGeneration: (results.judgesWithAnalytics / results.totalJudges * 100).toFixed(1),
      overallCompletion: 0
    };
    
    metrics.overallCompletion = (
      (parseFloat(metrics.caseCompletion) + 
       parseFloat(metrics.courtAssignment) + 
       parseFloat(metrics.analyticsGeneration)) / 3
    ).toFixed(1);
    
    console.log(`  📊 Case Requirement (500+): ${metrics.caseCompletion}% complete`);
    console.log(`  🏛️  Court Assignment: ${metrics.courtAssignment}% complete`);
    console.log(`  🤖 AI Analytics: ${metrics.analyticsGeneration}% complete`);
    console.log(`  ✅ Overall Completion: ${metrics.overallCompletion}%`);
    
    // Progress bar
    const progressBar = (percent) => {
      const filled = Math.round(percent / 2);
      const empty = 50 - filled;
      return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
    };
    
    console.log(`\n  Cases:     ${progressBar(parseFloat(metrics.caseCompletion))} ${metrics.caseCompletion}%`);
    console.log(`  Courts:    ${progressBar(parseFloat(metrics.courtAssignment))} ${metrics.courtAssignment}%`);
    console.log(`  Analytics: ${progressBar(parseFloat(metrics.analyticsGeneration))} ${metrics.analyticsGeneration}%`);
    
    // 5. Determine Success
    results.success = parseFloat(metrics.caseCompletion) === 100.0 && 
                     parseFloat(metrics.courtAssignment) >= 95.0;
    
    if (results.success) {
      console.log('\n🎉 SUCCESS! All California judges have 500+ cases and court information!');
    } else {
      console.log('\n⚠️  DATA INCOMPLETE - Continue processing:');
      if (parseFloat(metrics.caseCompletion) < 100) {
        console.log('  1. Run sync-ca-judge-decisions.js to fetch more cases');
      }
      if (parseFloat(metrics.courtAssignment) < 95) {
        console.log('  2. Run update-ca-courts.js to assign courts');
      }
      if (parseFloat(metrics.analyticsGeneration) < 100) {
        console.log('  3. Run batch-generate-analytics.js for AI analysis');
      }
    }
    
    // 6. Save Validation Report
    const report = {
      ...results,
      metrics,
      recommendations: results.success ? [] : [
        parseFloat(metrics.caseCompletion) < 100 && 'Fetch more court cases',
        parseFloat(metrics.courtAssignment) < 95 && 'Complete court assignments',
        parseFloat(metrics.analyticsGeneration) < 100 && 'Generate AI analytics'
      ].filter(Boolean)
    };
    
    await fs.writeFile(
      'ca-validation-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n💾 Validation report saved to ca-validation-report.json');
    
    return report;
    
  } catch (error) {
    console.error('\n❌ Validation Error:', error);
    results.issues.push(`Fatal error: ${error.message}`);
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  validateCaliforniaData()
    .then(report => {
      console.log('\n' + '=' .repeat(70));
      if (report.success) {
        console.log('✅ VALIDATION COMPLETE - DATA READY FOR PRODUCTION!');
        process.exit(0);
      } else {
        console.log('⚠️  VALIDATION INCOMPLETE - CONTINUE DATA PROCESSING');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Validation Failed:', error);
      process.exit(1);
    });
}

module.exports = { validateCaliforniaData };