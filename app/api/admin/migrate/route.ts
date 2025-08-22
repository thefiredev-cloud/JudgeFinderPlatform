import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting database migration...')
    
    const supabase = await createServerClient()
    
    // Since exec_sql doesn't exist, let's use a different approach
    // We'll manually execute operations step by step
    
    console.log('📝 Checking current table structure...')
    
    // Check if judges table has slug column
    const { data: judgeTest } = await supabase
      .from('judges')
      .select('*')
      .limit(1)
    
    const judgeColumns = judgeTest?.[0] ? Object.keys(judgeTest[0]) : []
    const hasJudgeSlug = judgeColumns.includes('slug')
    
    // Check if courts table has slug column
    const { data: courtTest } = await supabase
      .from('courts')
      .select('*')
      .limit(1)
    
    const courtColumns = courtTest?.[0] ? Object.keys(courtTest[0]) : []
    const hasCourtSlug = courtColumns.includes('slug')
    
    console.log(`📊 Judges columns: ${judgeColumns.join(', ')}`)
    console.log(`📊 Courts columns: ${courtColumns.join(', ')}`)
    console.log(`📊 Has judge slug: ${hasJudgeSlug}`)
    console.log(`📊 Has court slug: ${hasCourtSlug}`)
    
    if (!hasJudgeSlug || !hasCourtSlug) {
      return NextResponse.json({ 
        error: 'Slug columns missing from database', 
        details: 'Run SQL migration manually in Supabase dashboard first',
        status: {
          judgeSlug: hasJudgeSlug,
          courtSlug: hasCourtSlug,
          judgeColumns,
          courtColumns
        }
      }, { status: 400 })
    }
    
    // If we get here, columns exist, so let's generate slugs
    console.log('✅ Slug columns exist, generating slugs...')
    
    // Generate slugs for judges without them
    const { data: judgesWithoutSlugs } = await supabase
      .from('judges')
      .select('id, name, slug')
      .or('slug.is.null,slug.eq.')
    
    console.log(`📝 Found ${judgesWithoutSlugs?.length || 0} judges without slugs`)
    
    if (judgesWithoutSlugs?.length) {
      for (const judge of judgesWithoutSlugs) {
        const slug = generateSlug(judge.name, judge.id)
        if (slug) {
          await supabase
            .from('judges')
            .update({ slug })
            .eq('id', judge.id)
        }
      }
    }
    
    // Generate slugs for courts without them
    const { data: courtsWithoutSlugs } = await supabase
      .from('courts')
      .select('id, name, slug')
      .or('slug.is.null,slug.eq.')
    
    console.log(`📝 Found ${courtsWithoutSlugs?.length || 0} courts without slugs`)
    
    if (courtsWithoutSlugs?.length) {
      for (const court of courtsWithoutSlugs) {
        const slug = generateSlug(court.name, court.id)
        if (slug) {
          await supabase
            .from('courts')
            .update({ slug })
            .eq('id', court.id)
        }
      }
    }
    
    // Get sample data for verification
    const { data: sampleJudges } = await supabase
      .from('judges')
      .select('name, slug')
      .not('slug', 'is', null)
      .limit(5)
    
    const { data: sampleCourts } = await supabase
      .from('courts')
      .select('name, slug')
      .not('slug', 'is', null)
      .limit(5)
    
    console.log('🎉 Migration completed successfully!')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Slug generation completed successfully',
      updated: {
        judges: judgesWithoutSlugs?.length || 0,
        courts: courtsWithoutSlugs?.length || 0
      },
      samples: {
        judges: sampleJudges,
        courts: sampleCourts
      }
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

function generateSlug(name: string, id: string): string {
  if (!name || !id) return ''
  
  const cleanName = name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/\-+/g, '-')
    .replace(/^-|-$/g, '')
  
  const shortId = id.substring(0, 8)
  return `${cleanName}-${shortId}`
}