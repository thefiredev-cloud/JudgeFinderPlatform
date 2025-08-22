require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addJurisdictionColumn() {
  console.log('Adding jurisdiction column to cases table...');
  
  try {
    // Add the jurisdiction column if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name='cases' 
            AND column_name='jurisdiction'
          ) THEN
            ALTER TABLE cases 
            ADD COLUMN jurisdiction TEXT DEFAULT 'CA';
          END IF;
        END $$;
      `
    });

    if (error) {
      // Try a direct approach if RPC doesn't work
      const { error: alterError } = await supabase
        .from('cases')
        .select('id')
        .limit(1);
      
      if (alterError && alterError.message.includes('jurisdiction')) {
        console.log('Jurisdiction column might already exist or there is a schema issue');
      } else {
        // Try using raw SQL through Supabase admin
        console.log('Attempting to add jurisdiction column via direct SQL...');
        // This would need to be done through Supabase dashboard
        console.log('Please run this SQL in your Supabase SQL editor:');
        console.log(`
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'CA';
        `);
      }
    } else {
      console.log('✓ Jurisdiction column added successfully');
    }

    // Update existing records to have 'CA' as jurisdiction
    const { data, error: updateError } = await supabase
      .from('cases')
      .update({ jurisdiction: 'CA' })
      .is('jurisdiction', null);

    if (!updateError) {
      console.log(`✓ Updated ${data?.length || 0} records with CA jurisdiction`);
    }

  } catch (err) {
    console.error('Error adding jurisdiction column:', err);
    console.log('\nPlease manually run this SQL in your Supabase dashboard:');
    console.log(`
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'CA';

UPDATE cases 
SET jurisdiction = 'CA' 
WHERE jurisdiction IS NULL;
    `);
  }
}

addJurisdictionColumn();