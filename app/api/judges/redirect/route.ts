import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateNameVariations, nameToSlug } from '@/lib/utils/slug'
import { getBaseUrl } from '@/lib/utils/baseUrl'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Try to find judge by name variations
    const nameVariations = generateNameVariations(query)
    
    let foundJudge = null
    
    // Try exact name matches first
    for (const variation of nameVariations) {
      const { data: judges, error } = await supabase
        .from('judges')
        .select('id, name, slug, court_name')
        .ilike('name', variation)
        .limit(1)
        
      if (!error && judges && judges.length > 0) {
        foundJudge = judges[0]
        break
      }
    }
    
    // If no exact match, try fuzzy search
    if (!foundJudge) {
      const { data: judges, error } = await supabase
        .from('judges')
        .select('id, name, slug, court_name')
        .textSearch('name', query.split(' ').join(' | '))
        .limit(5)
        
      if (!error && judges && judges.length > 0) {
        // Find best match based on similarity
        foundJudge = judges[0]
      }
    }
    
    if (foundJudge) {
      // Generate canonical slug for the judge
      const canonicalSlug = foundJudge.slug || nameToSlug(foundJudge.name)
      
      const baseUrl = getBaseUrl()
      return NextResponse.json({
        found: true,
        judge: foundJudge,
        redirectUrl: `/judges/${canonicalSlug}`,
        canonicalUrl: `${baseUrl}/judges/${canonicalSlug}`,
        method: 'name_search'
      })
    }
    
    return NextResponse.json({
      found: false,
      suggestions: [],
      query: query
    }, { status: 404 })
    
  } catch (error) {
    console.error('Judge redirect API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
