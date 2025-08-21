const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function addSlugColumn() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration in .env.local')
    process.exit(1)
  }

  // Use the admin client for schema changes
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  console.log('🚀 Adding slug column to judges table...')

  try {
    // First, let's check if the column already exists
    console.log('🔍 Checking if slug column exists...')
    
    const { data: testData, error: testError } = await supabase
      .from('judges')
      .select('slug')
      .limit(1)

    if (testError && testError.message.includes('does not exist')) {
      console.log('📝 Slug column does not exist, creating it...')
      
      // The column doesn't exist, we need to add it manually
      // Let's fetch some judges to work with
      const { data: judges, error: fetchError } = await supabase
        .from('judges')
        .select('id, name')
        .limit(10)

      if (fetchError) {
        console.error('Error fetching judges:', fetchError.message)
        return
      }

      console.log(`✅ Found ${judges.length} judges. The slug column needs to be added manually to the database.`)
      console.log('📋 SQL to execute in Supabase dashboard:')
      console.log(`
-- Add slug column to judges table
ALTER TABLE judges ADD COLUMN slug VARCHAR(255);

-- Create index for fast lookups
CREATE INDEX idx_judges_slug ON judges(slug);

-- Add unique constraint
ALTER TABLE judges ADD CONSTRAINT judges_slug_unique UNIQUE(slug);
      `)

      // Now let's generate slugs for the existing judges
      console.log('🔧 Generating slugs for existing judges...')
      await generateAllSlugs(supabase)

    } else if (testError) {
      console.error('Error checking slug column:', testError.message)
      return
    } else {
      console.log('✅ Slug column already exists!')
      
      // Check how many judges have slugs
      const { count: totalJudges } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })

      const { count: judgesWithSlugs } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .not('slug', 'is', null)

      console.log(`📊 Current status:`)
      console.log(`   Total judges: ${totalJudges}`)
      console.log(`   Judges with slugs: ${judgesWithSlugs}`)
      console.log(`   Judges without slugs: ${totalJudges - judgesWithSlugs}`)

      if (judgesWithSlugs < totalJudges) {
        console.log('🔧 Generating missing slugs...')
        await generateMissingSlugs(supabase)
      } else {
        console.log('🎉 All judges already have slugs!')
      }
    }

  } catch (error) {
    console.error('❌ Operation failed:', error.message)
    process.exit(1)
  }
}

async function generateAllSlugs(supabase) {
  // Get all judges
  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, name')

  if (error) {
    console.error('Error fetching all judges:', error.message)
    return
  }

  console.log(`Found ${judges.length} judges to process`)
  
  const usedSlugs = new Set()
  const updates = []

  for (const judge of judges) {
    const baseSlug = generateSlug(judge.name)
    let finalSlug = baseSlug
    let counter = 1

    // Ensure uniqueness
    while (usedSlugs.has(finalSlug)) {
      counter++
      finalSlug = `${baseSlug}-${counter}`
    }

    usedSlugs.add(finalSlug)
    updates.push({
      id: judge.id,
      name: judge.name,
      slug: finalSlug
    })
  }

  console.log('📄 Generated slugs for all judges. Here are some examples:')
  updates.slice(0, 10).forEach((update, idx) => {
    console.log(`   ${idx + 1}. ${update.name} -> ${update.slug}`)
  })

  // Save slug mappings to a file for manual application
  const fs = require('fs')
  const slugMappings = updates.map(u => ({
    id: u.id,
    slug: u.slug,
    sql: `UPDATE judges SET slug = '${u.slug}' WHERE id = '${u.id}';`
  }))

  fs.writeFileSync('judge-slug-mappings.json', JSON.stringify(slugMappings, null, 2))
  console.log('💾 Saved slug mappings to judge-slug-mappings.json')

  // Create a SQL file for bulk update
  const sqlStatements = updates.map(u => 
    `UPDATE judges SET slug = '${u.slug.replace(/'/g, "''")}' WHERE id = '${u.id}';`
  ).join('\n')

  fs.writeFileSync('update-judge-slugs.sql', sqlStatements)
  console.log('💾 Saved SQL statements to update-judge-slugs.sql')
  
  console.log(`
🔗 Next steps:
1. Run this SQL in your Supabase dashboard to add the column:
   ALTER TABLE judges ADD COLUMN slug VARCHAR(255);
   CREATE INDEX idx_judges_slug ON judges(slug);
   
2. Then run the SQL from update-judge-slugs.sql to populate all slugs

3. Finally add the unique constraint:
   ALTER TABLE judges ADD CONSTRAINT judges_slug_unique UNIQUE(slug);
  `)
}

async function generateMissingSlugs(supabase) {
  // Get judges without slugs
  const { data: judgesWithoutSlugs, error } = await supabase
    .from('judges')
    .select('id, name')
    .is('slug', null)

  if (error) {
    console.error('Error fetching judges without slugs:', error.message)
    return
  }

  console.log(`Found ${judgesWithoutSlugs.length} judges without slugs`)

  // Get existing slugs to avoid conflicts
  const { data: existingSlugs } = await supabase
    .from('judges')
    .select('slug')
    .not('slug', 'is', null)

  const usedSlugs = new Set(existingSlugs.map(j => j.slug))

  for (const judge of judgesWithoutSlugs) {
    const baseSlug = generateSlug(judge.name)
    let finalSlug = baseSlug
    let counter = 1

    while (usedSlugs.has(finalSlug)) {
      counter++
      finalSlug = `${baseSlug}-${counter}`
    }

    usedSlugs.add(finalSlug)

    // Update judge with slug
    const { error: updateError } = await supabase
      .from('judges')
      .update({ slug: finalSlug })
      .eq('id', judge.id)

    if (updateError) {
      console.error(`Failed to update judge ${judge.name}:`, updateError.message)
    } else {
      console.log(`✅ Generated slug for ${judge.name}: ${finalSlug}`)
    }
  }

  console.log('🎉 Slug generation completed!')
}

function generateSlug(name) {
  if (!name) return 'unknown-judge'
  
  return name
    .toLowerCase()
    .trim()
    .replace(/^(judge|justice|the honorable|hon\.?)\s+/gi, '') // Remove titles
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    || 'unknown-judge' // Fallback if empty
}

// Run the migration
addSlugColumn().catch(console.error)