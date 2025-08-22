/**
 * California Courts Update Script
 * Updates court information and establishes court-judge relationships
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CACourtUpdater {
  constructor() {
    this.stats = {
      courtsProcessed: 0,
      courtsUpdated: 0,
      relationshipsCreated: 0,
      errors: 0
    };
  }

  async updateCourtInfo() {
    console.log('\n🏛️  UPDATING CALIFORNIA COURTS');
    console.log('=' .repeat(60));
    
    try {
      // Get all California courts
      const { data: courts, error } = await supabase
        .from('courts')
        .select('*')
        .or('jurisdiction.ilike.%CA%,jurisdiction.ilike.%California%,name.ilike.%California%');
      
      if (error) throw error;
      
      console.log(`Found ${courts.length} California courts\n`);
      
      // Update each court with proper metadata
      for (const court of courts) {
        try {
          console.log(`Processing: ${court.name}`);
          
          // Ensure California jurisdiction
          const updates = {
            jurisdiction: court.jurisdiction || 'CA',
            updated_at: new Date().toISOString()
          };
          
          // Add court type classification
          if (court.name.includes('Superior')) {
            updates.court_type = 'Superior Court';
            updates.level = 'Trial';
          } else if (court.name.includes('Appeals') || court.name.includes('Appellate')) {
            updates.court_type = 'Court of Appeal';
            updates.level = 'Appellate';
          } else if (court.name.includes('Supreme')) {
            updates.court_type = 'Supreme Court';
            updates.level = 'Supreme';
          } else if (court.name.includes('District')) {
            updates.court_type = 'District Court';
            updates.level = 'Federal Trial';
          } else if (court.name.includes('Bankruptcy')) {
            updates.court_type = 'Bankruptcy Court';
            updates.level = 'Federal Specialized';
          }
          
          // Extract county from court name
          const countyMatch = court.name.match(/County of ([^,]+)/i);
          if (countyMatch) {
            updates.county = countyMatch[1].trim();
          }
          
          // Update court
          const { error: updateError } = await supabase
            .from('courts')
            .update(updates)
            .eq('id', court.id);
          
          if (!updateError) {
            this.stats.courtsUpdated++;
            console.log(`  ✅ Updated court metadata`);
          }
          
          this.stats.courtsProcessed++;
          
        } catch (error) {
          console.error(`  ❌ Error processing court: ${error.message}`);
          this.stats.errors++;
        }
      }
      
      console.log(`\n✅ Updated ${this.stats.courtsUpdated} courts`);
      
    } catch (error) {
      console.error('❌ Error updating courts:', error);
      throw error;
    }
  }

  async createCourtJudgeRelationships() {
    console.log('\n🔗 ESTABLISHING COURT-JUDGE RELATIONSHIPS');
    console.log('=' .repeat(60));
    
    try {
      // Get all CA judges with court information
      const { data: judges, error: judgeError } = await supabase
        .from('judges')
        .select('id, name, court_id, court_name, jurisdiction')
        .or('jurisdiction.eq.CA,jurisdiction.ilike.%California%,court_name.ilike.%California%');
      
      if (judgeError) throw judgeError;
      
      console.log(`Processing ${judges.length} California judges\n`);
      
      for (const judge of judges) {
        try {
          // Skip if judge already has court_id
          if (judge.court_id) {
            continue;
          }
          
          // Try to find matching court by name
          if (judge.court_name) {
            const { data: matchingCourts, error: searchError } = await supabase
              .from('courts')
              .select('id, name')
              .ilike('name', `%${judge.court_name.replace(/[^\w\s]/g, '%')}%`)
              .limit(1);
            
            if (!searchError && matchingCourts && matchingCourts.length > 0) {
              // Update judge with court_id
              const { error: updateError } = await supabase
                .from('judges')
                .update({ court_id: matchingCourts[0].id })
                .eq('id', judge.id);
              
              if (!updateError) {
                console.log(`  ✅ Linked ${judge.name} to ${matchingCourts[0].name}`);
                
                // Create court_judge_assignment record
                const assignment = {
                  court_id: matchingCourts[0].id,
                  judge_id: judge.id,
                  start_date: judge.appointed_date || new Date().toISOString(),
                  status: 'active',
                  created_at: new Date().toISOString()
                };
                
                await supabase
                  .from('court_judge_assignments')
                  .upsert(assignment, {
                    onConflict: 'court_id,judge_id',
                    ignoreDuplicates: true
                  });
                
                this.stats.relationshipsCreated++;
              }
            }
          }
        } catch (error) {
          console.error(`  ❌ Error processing judge ${judge.name}: ${error.message}`);
          this.stats.errors++;
        }
      }
      
      console.log(`\n✅ Created ${this.stats.relationshipsCreated} court-judge relationships`);
      
    } catch (error) {
      console.error('❌ Error creating relationships:', error);
      throw error;
    }
  }

  async generateCourtStatistics() {
    console.log('\n📊 GENERATING COURT STATISTICS');
    console.log('=' .repeat(60));
    
    try {
      // Get all CA courts
      const { data: courts, error } = await supabase
        .from('courts')
        .select('id, name')
        .or('jurisdiction.ilike.%CA%,jurisdiction.ilike.%California%,name.ilike.%California%');
      
      if (error) throw error;
      
      for (const court of courts) {
        // Count judges assigned to this court
        const { count: judgeCount } = await supabase
          .from('judges')
          .select('*', { count: 'exact', head: true })
          .eq('court_id', court.id);
        
        // Count cases in this court
        const { count: caseCount } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('court_id', court.id);
        
        // Update court with statistics
        const stats = {
          total_judges: judgeCount || 0,
          total_cases: caseCount || 0,
          annual_filings: Math.round((caseCount || 0) / 3), // Estimate based on 3 years of data
          updated_at: new Date().toISOString()
        };
        
        await supabase
          .from('courts')
          .update(stats)
          .eq('id', court.id);
        
        console.log(`  ${court.name}: ${stats.total_judges} judges, ${stats.total_cases} cases`);
      }
      
      console.log('\n✅ Court statistics updated');
      
    } catch (error) {
      console.error('❌ Error generating statistics:', error);
      throw error;
    }
  }

  async ensureCaliforniaCourts() {
    console.log('\n🏛️  ENSURING ALL CA COURTS EXIST');
    console.log('=' .repeat(60));
    
    // List of major California courts that should exist
    const californiaCounties = [
      'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa',
      'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo',
      'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa',
      'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange',
      'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino',
      'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo',
      'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou',
      'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare',
      'Tuolumne', 'Ventura', 'Yolo', 'Yuba'
    ];
    
    let courtsCreated = 0;
    
    for (const county of californiaCounties) {
      const courtName = `Superior Court of California, County of ${county}`;
      
      // Check if court exists
      const { data: existing } = await supabase
        .from('courts')
        .select('id')
        .eq('name', courtName)
        .single();
      
      if (!existing) {
        // Create the court
        const newCourt = {
          name: courtName,
          jurisdiction: 'CA',
          court_type: 'Superior Court',
          level: 'Trial',
          county: county,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('courts')
          .insert(newCourt);
        
        if (!error) {
          courtsCreated++;
          console.log(`  ✅ Created ${courtName}`);
        }
      }
    }
    
    // Add California appellate courts
    const appellateCourts = [
      { name: 'California Court of Appeal, First District', district: 'First' },
      { name: 'California Court of Appeal, Second District', district: 'Second' },
      { name: 'California Court of Appeal, Third District', district: 'Third' },
      { name: 'California Court of Appeal, Fourth District', district: 'Fourth' },
      { name: 'California Court of Appeal, Fifth District', district: 'Fifth' },
      { name: 'California Court of Appeal, Sixth District', district: 'Sixth' }
    ];
    
    for (const court of appellateCourts) {
      const { data: existing } = await supabase
        .from('courts')
        .select('id')
        .eq('name', court.name)
        .single();
      
      if (!existing) {
        const newCourt = {
          name: court.name,
          jurisdiction: 'CA',
          court_type: 'Court of Appeal',
          level: 'Appellate',
          district: court.district,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('courts')
          .insert(newCourt);
        
        if (!error) {
          courtsCreated++;
          console.log(`  ✅ Created ${court.name}`);
        }
      }
    }
    
    // Add California Supreme Court
    const supremeCourt = {
      name: 'Supreme Court of California',
      jurisdiction: 'CA',
      court_type: 'Supreme Court',
      level: 'Supreme',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: existingSupreme } = await supabase
      .from('courts')
      .select('id')
      .eq('name', supremeCourt.name)
      .single();
    
    if (!existingSupreme) {
      const { error } = await supabase
        .from('courts')
        .insert(supremeCourt);
      
      if (!error) {
        courtsCreated++;
        console.log(`  ✅ Created ${supremeCourt.name}`);
      }
    }
    
    console.log(`\n✅ Ensured ${courtsCreated} new California courts`);
  }

  async run() {
    console.log('\n🚀 CALIFORNIA COURTS UPDATE PROCESS');
    console.log('=' .repeat(60));
    
    try {
      // Ensure all CA courts exist
      await this.ensureCaliforniaCourts();
      
      // Update court information
      await this.updateCourtInfo();
      
      // Create court-judge relationships
      await this.createCourtJudgeRelationships();
      
      // Generate statistics
      await this.generateCourtStatistics();
      
      // Final summary
      console.log('\n' + '=' .repeat(60));
      console.log('✅ CALIFORNIA COURTS UPDATE COMPLETE');
      console.log(`📊 Courts processed: ${this.stats.courtsProcessed}`);
      console.log(`✅ Courts updated: ${this.stats.courtsUpdated}`);
      console.log(`🔗 Relationships created: ${this.stats.relationshipsCreated}`);
      console.log(`❌ Errors: ${this.stats.errors}`);
      
    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new CACourtUpdater();
  updater.run()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Failed:', error);
      process.exit(1);
    });
}

module.exports = CACourtUpdater;