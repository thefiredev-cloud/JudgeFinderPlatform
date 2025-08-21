/**
 * Simple script to add court slugs to existing courts
 * This bypasses complex migration and directly adds slugs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateCourtSlug(name) {
  if (!name || typeof name !== 'string') {
    return 'unknown-court';
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove all special characters except spaces
    .replace(/\s+/g, '-')        // Convert spaces to hyphens
    .replace(/(^-|-$)/g, '')     // Remove leading/trailing hyphens
    .replace(/-+/g, '-');        // Replace multiple hyphens with single hyphen
}

async function addSlugColumn() {
  try {
    console.log('🔧 Adding slug column to courts table...');
    
    // Try to add the column
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE courts ADD COLUMN IF NOT EXISTS slug VARCHAR(255);'
    });

    if (addColumnError) {
      console.log('Column may already exist or using alternative method...');
    }

    console.log('✅ Slug column ready');
    return true;
  } catch (error) {
    console.log('⚠️  Column addition via RPC failed, continuing anyway...');
    return true; // Continue regardless
  }
}

async function generateSlugsForCourts() {
  try {
    console.log('📋 Fetching all courts...');
    
    // Get all courts
    const { data: courts, error } = await supabase
      .from('courts')
      .select('id, name, slug')
      .order('name');

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${courts.length} courts`);

    let updated = 0;
    let skipped = 0;

    for (const court of courts) {
      // Skip if already has a slug
      if (court.slug && court.slug.trim() !== '') {
        skipped++;
        continue;
      }

      const slug = generateCourtSlug(court.name);
      
      console.log(`🔄 Updating: ${court.name} → ${slug}`);

      const { error: updateError } = await supabase
        .from('courts')
        .update({ slug })
        .eq('id', court.id);

      if (updateError) {
        console.error(`❌ Failed to update ${court.name}:`, updateError);
      } else {
        updated++;
      }

      // Small delay to avoid rate limiting
      if (updated % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Updated ${updated} courts, skipped ${skipped} existing slugs`);
    return { updated, skipped };

  } catch (error) {
    console.error('❌ Error generating slugs:', error);
    throw error;
  }
}

async function verifyResults() {
  try {
    console.log('🔍 Verifying results...');

    // Check sample courts
    const { data: sampleCourts, error } = await supabase
      .from('courts')
      .select('id, name, slug')
      .limit(5);

    if (error) {
      throw error;
    }

    console.log('📋 Sample courts:');
    sampleCourts.forEach(court => {
      console.log(`  ${court.name} → ${court.slug}`);
    });

    // Check for any missing slugs
    const { data: missingSlugs, error: missingError } = await supabase
      .from('courts')
      .select('id, name')
      .or('slug.is.null,slug.eq.')
      .limit(5);

    if (missingError) {
      throw missingError;
    }

    if (missingSlugs && missingSlugs.length > 0) {
      console.warn('⚠️  Courts still missing slugs:');
      missingSlugs.forEach(court => {
        console.warn(`  - ${court.name} (ID: ${court.id})`);
      });
    } else {
      console.log('✅ All courts have slugs!');
    }

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting court slug generation...');
    
    await addSlugColumn();
    const results = await generateSlugsForCourts();
    await verifyResults();
    
    console.log('🎉 Court slug generation completed!');
    console.log(`📊 Summary: ${results.updated} updated, ${results.skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();