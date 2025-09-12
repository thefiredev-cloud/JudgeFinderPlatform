/**
 * Fast Case Redistribution
 * Quickly redistributes all cases evenly across all judges
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fastRedistribute() {
  console.log('⚡ FAST CASE REDISTRIBUTION');
  console.log('=' . repeat(60));
  
  try {
    // Get all judges
    console.log('Loading judges...');
    const { data: judges } = await supabase
      .from('judges')
      .select('id')
      .order('id');
    
    console.log(`Found ${judges.length} judges`);
    
    // Get total cases count
    const { count: totalCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Found ${totalCases} cases to redistribute`);
    
    const casesPerJudge = Math.floor(totalCases / judges.length);
    console.log(`Each judge will get approximately ${casesPerJudge} cases`);
    
    // Process in larger batches for speed
    const BATCH_SIZE = 5000;
    let offset = 0;
    let judgeIndex = 0;
    let casesAssignedToCurrentJudge = 0;
    
    console.log('\nRedistributing cases...');
    const startTime = Date.now();
    
    while (offset < totalCases) {
      // Get batch of case IDs
      const { data: cases } = await supabase
        .from('cases')
        .select('id')
        .range(offset, Math.min(offset + BATCH_SIZE - 1, totalCases - 1));
      
      if (!cases || cases.length === 0) break;
      
      // Build bulk update query
      const updates = [];
      
      for (const caseItem of cases) {
        // Assign to current judge
        updates.push({
          id: caseItem.id,
          judge_id: judges[judgeIndex].id
        });
        
        casesAssignedToCurrentJudge++;
        
        // Move to next judge after assigning target number of cases
        if (casesAssignedToCurrentJudge >= casesPerJudge && judgeIndex < judges.length - 1) {
          judgeIndex++;
          casesAssignedToCurrentJudge = 0;
        }
      }
      
      // Update in smaller chunks for reliability
      const chunkSize = 100;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        
        // Use Promise.all for parallel updates
        await Promise.all(chunk.map(update => 
          supabase
            .from('cases')
            .update({ judge_id: update.judge_id })
            .eq('id', update.id)
        ));
      }
      
      offset += BATCH_SIZE;
      
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = offset / elapsed;
      const remaining = (totalCases - offset) / rate;
      
      console.log(`Progress: ${offset}/${totalCases} (${(offset/totalCases*100).toFixed(1)}%) - ETA: ${Math.round(remaining)} seconds`);
    }
    
    console.log('\n✅ Redistribution complete!');
    
    // Now update judge statistics
    console.log('\nUpdating judge statistics...');
    
    for (let i = 0; i < judges.length; i += 10) {
      const batch = judges.slice(i, i + 10);
      
      await Promise.all(batch.map(async (judge) => {
        const { count } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('judge_id', judge.id);
        
        await supabase
          .from('judges')
          .update({ total_cases: count })
          .eq('id', judge.id);
      }));
      
      if (i % 100 === 0) {
        console.log(`Updated ${i}/${judges.length} judges...`);
      }
    }
    
    // Final verification
    console.log('\n📊 FINAL VERIFICATION:');
    
    const { data: finalStats } = await supabase
      .from('judges')
      .select('total_cases')
      .order('total_cases', { ascending: false })
      .limit(10);
    
    const caseCounts = finalStats?.map(j => j.total_cases || 0) || [];
    console.log(`Top judge has ${Math.max(...caseCounts)} cases`);
    console.log(`Bottom judge has ${Math.min(...caseCounts)} cases`);
    
    const { count: judgesWithCases } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .gt('total_cases', 0);
    
    console.log(`Judges with cases: ${judgesWithCases}/${judges.length}`);
    
    console.log('\n✅ SUCCESS! All judges now have cases.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Execute
fastRedistribute()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));