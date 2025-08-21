require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Inline slug generation function to avoid module import issues
function generateCourtSlug(name) {
  if (!name || typeof name !== 'string') {
    console.warn('Invalid court name provided to generateCourtSlug:', name)
    return 'unknown-court'
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')    // Only keep letters, numbers, and spaces
    .replace(/\s+/g, '-')           // Convert spaces to hyphens
    .replace(/(^-|-$)/g, '')        // Remove leading/trailing hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen

  if (!slug || slug === '' || slug === '-') {
    console.warn('Generated empty slug for court name:', name)
    return 'unknown-court'
  }

  return slug
}

async function populateCourtSlugs() {
  console.log('Starting court slug population...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Try to check if the slug column exists by attempting to query it
    console.log('Checking if slug column exists...')
    const { data: testQuery, error: testError } = await supabase
      .from('courts')
      .select('id, name, slug')
      .limit(1)
    
    if (testError && testError.code === '42703') {
      console.log('Slug column does not exist. Please run the SQL migration manually in Supabase dashboard:')
      console.log('')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run this SQL:')
      console.log('')
      console.log('ALTER TABLE courts ADD COLUMN slug VARCHAR(255);')
      console.log('CREATE INDEX IF NOT EXISTS idx_courts_slug ON courts(slug);')
      console.log('')
      console.log('4. Then run this script again: node scripts/populate-court-slugs.js')
      return
    }
    
    if (testError) {
      console.error('Error testing courts table:', testError)
      return
    }
    
    console.log('Slug column exists, proceeding with population...')
    
    // Get all courts without slugs
    console.log('Fetching courts without slugs...')
    const { data: courts, error: fetchError } = await supabase
      .from('courts')
      .select('id, name, slug')
      .is('slug', null)
    
    if (fetchError) {
      console.error('Error fetching courts:', fetchError)
      return
    }
    
    console.log(`Found ${courts.length} courts without slugs`)
    
    // Process courts in batches
    const batchSize = 50
    let processed = 0
    
    for (let i = 0; i < courts.length; i += batchSize) {
      const batch = courts.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(courts.length / batchSize)}...`)
      
      const updates = batch.map(court => ({
        id: court.id,
        slug: generateCourtSlug(court.name)
      }))
      
      // Update each court with its slug
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('courts')
          .update({ slug: update.slug })
          .eq('id', update.id)
        
        if (updateError) {
          console.error(`Error updating court ${update.id}:`, updateError)
        } else {
          processed++
          if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${courts.length} courts...`)
          }
        }
      }
    }
    
    console.log(`Successfully processed ${processed} courts`)
    
    // Verify results
    const { data: verification, error: verifyError } = await supabase
      .from('courts')
      .select('id, name, slug')
      .not('slug', 'is', null)
      .limit(5)
    
    if (verification && verification.length > 0) {
      console.log('Sample courts with slugs:')
      verification.forEach(court => {
        console.log(`- ${court.name} -> ${court.slug}`)
      })
    }
    
    console.log('Court slug population completed!')
    
  } catch (error) {
    console.error('Error during slug population:', error)
  }
}

// Run the script
populateCourtSlugs().catch(console.error)