import type { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { createCanonicalSlug, resolveCourtSlug } from '@/lib/utils/slug'
import { getBaseUrl } from '@/lib/utils/baseUrl'

// Force dynamic rendering since we need to query the database
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getBaseUrl()
  const supabase = await createServerClient()
  const { data: judges } = await supabase
    .from('judges')
    .select('name, slug, updated_at')
    .limit(2000)

  const judgeEntries = (judges || []).map((j) => {
    // Use canonical slug - either from database or generate one
    const canonicalSlug = j.slug || createCanonicalSlug(j.name)
    const lastModified = j.updated_at ? new Date(j.updated_at) : new Date()
    
    return {
      url: `${siteUrl}/judges/${canonicalSlug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }
  })

  // Add court entries to sitemap
  const { data: courts } = await supabase
    .from('courts')
    .select('name, slug, updated_at')
    .limit(500)

  const courtEntries = (courts || []).map((c) => {
    const slug = resolveCourtSlug(c) || createCanonicalSlug(c.name)
    const lastModified = c.updated_at ? new Date(c.updated_at) : new Date()
    
    return {
      url: `${siteUrl}/courts/${slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  const { data: jurisdictionRows } = await supabase
    .from('courts')
    .select('jurisdiction, updated_at')
    .not('jurisdiction', 'is', null)
    .limit(500)

  const jurisdictionSet = new Map<string, Date>()

  ;(jurisdictionRows || []).forEach((row) => {
    if (!row.jurisdiction) return
    const slug = createCanonicalSlug(String(row.jurisdiction))
    if (!slug) return
    const updatedAt = row.updated_at ? new Date(row.updated_at) : new Date()
    const existing = jurisdictionSet.get(slug)
    if (!existing || updatedAt > existing) {
      jurisdictionSet.set(slug, updatedAt)
    }
  })

  const fallbackJurisdictions = [
    'los-angeles-county',
    'orange-county',
    'san-diego-county',
    'san-francisco-county',
    'santa-clara-county',
    'alameda-county'
  ]

  fallbackJurisdictions.forEach((slug) => {
    if (!jurisdictionSet.has(slug)) {
      jurisdictionSet.set(slug, new Date())
    }
  })

  const jurisdictionEntries = Array.from(jurisdictionSet.entries()).map(([slug, updated]) => ({
    url: `${siteUrl}/jurisdictions/${slug}`,
    lastModified: updated,
    changeFrequency: 'monthly' as const,
    priority: 0.55,
  }))

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/judges`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/courts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/jurisdictions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/docs/methodology`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/docs/governance`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/docs/changelog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.45,
    },
    {
      url: `${siteUrl}/docs/ads-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.45,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...judgeEntries,
    ...courtEntries,
    ...jurisdictionEntries,
  ]
}
