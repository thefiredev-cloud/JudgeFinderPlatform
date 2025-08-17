#!/usr/bin/env node

/**
 * Migration Script: Convert existing judge-court relationships to new assignment tracking system
 * 
 * This script migrates existing court assignments from the judges table to the new
 * court_assignments table with proper date tracking and validation.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class AssignmentMigration {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
    this.errors = [];
  }

  async validateDatabaseConnection() {
    try {
      const { data, error } = await supabase.from('judges').select('id').limit(1);
      if (error) throw error;
      console.log('✅ Database connection validated');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async ensureAssignmentTableExists() {
    try {
      const { data, error } = await supabase.from('court_assignments').select('id').limit(1);
      if (error && error.code === 'PGRST116') {
        console.error('❌ court_assignments table does not exist. Please run create-court-assignments-table.sql first.');
        return false;
      }
      console.log('✅ court_assignments table exists');
      return true;
    } catch (error) {
      console.error('❌ Error checking court_assignments table:', error.message);
      return false;
    }
  }

  async getExistingJudgeCourtData() {
    try {
      console.log('📊 Fetching existing judge-court relationships...');
      
      const { data: judges, error } = await supabase
        .from('judges')
        .select(`
          id,
          name,
          court_id,
          court_name,
          jurisdiction,
          appointed_date,
          courtlistener_data,
          created_at,
          updated_at
        `)
        .not('court_id', 'is', null);

      if (error) throw error;

      console.log(`📋 Found ${judges.length} judges with court assignments`);
      return judges;
    } catch (error) {
      console.error('❌ Error fetching judge data:', error.message);
      throw error;
    }
  }

  async checkExistingAssignments() {
    try {
      const { data, error } = await supabase
        .from('court_assignments')
        .select('judge_id, court_id')
        .limit(1000);

      if (error) throw error;

      const existingMap = new Set();
      data.forEach(assignment => {
        existingMap.add(`${assignment.judge_id}-${assignment.court_id}`);
      });

      console.log(`📋 Found ${data.length} existing assignments in court_assignments table`);
      return existingMap;
    } catch (error) {
      console.error('❌ Error checking existing assignments:', error.message);
      return new Set();
    }
  }

  estimateAssignmentDate(judge) {
    // Priority order for assignment date estimation
    
    // 1. Use appointed_date if available
    if (judge.appointed_date) {
      const appointedDate = new Date(judge.appointed_date);
      if (appointedDate > new Date('1900-01-01') && appointedDate <= new Date()) {
        return appointedDate.toISOString().split('T')[0];
      }
    }

    // 2. Extract from courtlistener_data positions
    if (judge.courtlistener_data?.positions) {
      const positions = judge.courtlistener_data.positions;
      for (const position of positions) {
        if (position.date_start) {
          const startDate = new Date(position.date_start);
          if (startDate > new Date('1900-01-01') && startDate <= new Date()) {
            return startDate.toISOString().split('T')[0];
          }
        }
      }
    }

    // 3. Use judge record creation date as fallback (conservative estimate)
    if (judge.created_at) {
      const createdDate = new Date(judge.created_at);
      // Assume assignment started 30 days before record creation
      createdDate.setDate(createdDate.getDate() - 30);
      return createdDate.toISOString().split('T')[0];
    }

    // 4. Default to 5 years ago as last resort
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 5);
    return defaultDate.toISOString().split('T')[0];
  }

  extractPositionDetails(judge) {
    const details = {
      position_title: null,
      appointment_authority: null,
      confirmation_date: null
    };

    if (judge.courtlistener_data?.positions) {
      const positions = judge.courtlistener_data.positions;
      const currentPosition = positions.find(p => !p.date_termination) || positions[0];
      
      if (currentPosition) {
        details.position_title = currentPosition.position_type || 'Judge';
        details.appointment_authority = currentPosition.appointer?.name_full;
        details.confirmation_date = currentPosition.date_confirmation;
      }
    }

    return details;
  }

  async migrateJudgeAssignment(judge, existingAssignments) {
    try {
      const assignmentKey = `${judge.id}-${judge.court_id}`;
      
      // Skip if assignment already exists
      if (existingAssignments.has(assignmentKey)) {
        console.log(`⏭️  Skipping ${judge.name}: Assignment already exists`);
        this.skippedCount++;
        return;
      }

      const assignmentStartDate = this.estimateAssignmentDate(judge);
      const positionDetails = this.extractPositionDetails(judge);

      const assignmentData = {
        judge_id: judge.id,
        court_id: judge.court_id,
        assignment_start_date: assignmentStartDate,
        assignment_end_date: null, // Assume current assignment is ongoing
        assignment_type: 'primary',
        assignment_status: 'active',
        position_title: positionDetails.position_title,
        department: null,
        calendar_type: null,
        workload_percentage: 100.00,
        appointment_authority: positionDetails.appointment_authority,
        confirmation_date: positionDetails.confirmation_date,
        notes: `Migrated from existing judge.court_id relationship. Original court_name: ${judge.court_name}`,
        metadata: {
          migration_source: 'judges_table',
          original_court_name: judge.court_name,
          jurisdiction: judge.jurisdiction,
          migration_date: new Date().toISOString(),
          courtlistener_positions: judge.courtlistener_data?.positions || null
        },
        data_source: 'migration',
        last_verified_date: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('court_assignments')
        .insert(assignmentData)
        .select('id');

      if (error) {
        console.error(`❌ Error migrating ${judge.name}:`, error.message);
        this.errors.push({ judge: judge.name, error: error.message });
        this.errorCount++;
        return;
      }

      console.log(`✅ Migrated ${judge.name} to court assignment ${data[0].id}`);
      this.migratedCount++;

    } catch (error) {
      console.error(`❌ Unexpected error migrating ${judge.name}:`, error.message);
      this.errors.push({ judge: judge.name, error: error.message });
      this.errorCount++;
    }
  }

  async validateMigration() {
    try {
      console.log('\n🔍 Validating migration results...');

      // Count assignments created
      const { data: assignmentCount, error: countError } = await supabase
        .from('court_assignments')
        .select('id', { count: 'exact' })
        .eq('data_source', 'migration');

      if (countError) throw countError;

      console.log(`📊 Total assignments with migration source: ${assignmentCount.length}`);

      // Check for judges without assignments
      const { data: judgesWithoutAssignments, error: noAssignError } = await supabase
        .from('judges')
        .select('id, name, court_id')
        .not('court_id', 'is', null)
        .not('id', 'in', `(SELECT judge_id FROM court_assignments WHERE data_source = 'migration')`);

      if (noAssignError) throw noAssignError;

      if (judgesWithoutAssignments.length > 0) {
        console.log(`⚠️  ${judgesWithoutAssignments.length} judges with court_id still need assignment migration`);
      } else {
        console.log('✅ All judges with court_id have been migrated');
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating migration:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting court assignment migration...\n');

    // Validate setup
    if (!(await this.validateDatabaseConnection())) return false;
    if (!(await this.ensureAssignmentTableExists())) return false;

    try {
      // Get existing data
      const judges = await this.getExistingJudgeCourtData();
      const existingAssignments = await this.checkExistingAssignments();

      if (judges.length === 0) {
        console.log('ℹ️  No judges with court assignments found. Migration complete.');
        return true;
      }

      console.log(`\n📋 Processing ${judges.length} judge assignments...\n`);

      // Process in batches
      const batchSize = 10;
      for (let i = 0; i < judges.length; i += batchSize) {
        const batch = judges.slice(i, i + batchSize);
        
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(judges.length / batchSize)}`);
        
        for (const judge of batch) {
          await this.migrateJudgeAssignment(judge, existingAssignments);
        }

        // Brief pause between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Validation
      await this.validateMigration();

      // Summary
      console.log('\n📊 Migration Summary:');
      console.log(`✅ Successfully migrated: ${this.migratedCount}`);
      console.log(`⏭️  Skipped (already exists): ${this.skippedCount}`);
      console.log(`❌ Errors: ${this.errorCount}`);

      if (this.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.errors.forEach(error => {
          console.log(`  - ${error.judge}: ${error.error}`);
        });
      }

      return this.errorCount === 0;

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      return false;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new AssignmentMigration();
  migration.run()
    .then(success => {
      if (success) {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Migration completed with errors');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = AssignmentMigration;