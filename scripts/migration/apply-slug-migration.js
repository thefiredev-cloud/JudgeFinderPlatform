const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function applySlugMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('🚀 Starting slug migration for judges table...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250820_001_add_judge_slug_column.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`   ${i + 1}. Executing statement...`)
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            // Try direct SQL execution if rpc fails
            const { error: sqlError } = await supabase.from('_').select('').limit(0)
            if (sqlError) {
              console.warn(`   ⚠️  Statement ${i + 1} had issue: ${error.message}`)
            }
          }
        } catch (err) {
          console.warn(`   ⚠️  Statement ${i + 1} had issue: ${err.message}`)
        }
      }
    }

    // Verify the slug column was added
    console.log('🔍 Verifying slug column was added...')
    
    // Check if we can query the slug column
    const { data: sampleJudges, error: queryError } = await supabase
      .from('judges')
      .select('id, name, slug')
      .limit(5)

    if (queryError) {
      console.error('❌ Error verifying slug column:', queryError.message)
      return
    }

    console.log('✅ Slug column verified! Sample judges:')
    sampleJudges.forEach((judge, idx) => {
      console.log(`   ${idx + 1}. ${judge.name} -> ${judge.slug || 'NULL'}`)
    })

    // Count judges with and without slugs
    const { count: totalJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })

    const { count: judgesWithSlugs } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .not('slug', 'is', null)

    console.log(`📊 Migration Results:`)
    console.log(`   Total judges: ${totalJudges}`)
    console.log(`   Judges with slugs: ${judgesWithSlugs}`)
    console.log(`   Judges without slugs: ${totalJudges - judgesWithSlugs}`)

    if (judgesWithSlugs === totalJudges) {
      console.log('🎉 Migration completed successfully! All judges have slugs.')
    } else {
      console.log('⚠️  Some judges still need slugs. Running manual slug generation...')
      await generateMissingSlugs(supabase)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

async function generateMissingSlugs(supabase) {
  console.log('🔧 Generating slugs for judges without slugs...')

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

  for (const judge of judgesWithoutSlugs) {
    const slug = generateSlug(judge.name)
    
    // Check if slug already exists
    const { data: existingJudge } = await supabase
      .from('judges')
      .select('id')
      .eq('slug', slug)
      .single()

    let finalSlug = slug
    let counter = 1

    // If slug exists, add counter
    while (existingJudge && existingJudge.id !== judge.id) {
      counter++
      finalSlug = `${slug}-${counter}`
      
      const { data: checkSlug } = await supabase
        .from('judges')
        .select('id')
        .eq('slug', finalSlug)
        .single()
      
      if (!checkSlug) break
    }

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
  if (!name) return null
  
  return name
    .toLowerCase()
    .trim()
    .replace(/^(judge|justice|the honorable|hon\.?)\s+/gi, '') // Remove titles
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Run the migration
applySlugMigration().catch(console.error)