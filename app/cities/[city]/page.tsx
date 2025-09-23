import { createServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Params { city: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params
  const title = `${decodeURIComponent(city).replace(/-/g, ' ')} Courts | JudgeFinder`
  return {
    title,
    description: `Browse courts located in ${decodeURIComponent(city).replace(/-/g, ' ')}`
  }
}

function normalizeCity(cityParam: string): string {
  return decodeURIComponent(cityParam).replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
}

function cityMatches(name?: string | null, address?: string | number | null, city?: string | null): boolean {
  if (!city) return false
  const c = city.toLowerCase()
  if (typeof name === 'string') {
    if (new RegExp(`^${city}\\s+WCAB$`, 'i').test(name)) return true
    if (new RegExp(`^${city}\\s+(Municipal|Justice)\\s+Court$`, 'i').test(name)) return true
  }
  if (typeof address === 'string') {
    if (new RegExp(`,\\s*${city}\\s*,`, 'i').test(address)) return true
    const first = address.split(',')[0]?.trim().toLowerCase()
    if (first && first === c) return true
  }
  return false
}

export default async function CityPage({ params }: { params: Promise<Params> }) {
  const { city } = await params
  const cityName = normalizeCity(city)
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('courts')
    .select('id, name, type, jurisdiction, address, website, phone')
    .limit(5000)

  const courts = (data || []).filter(row => cityMatches(row.name as string, row.address as any, cityName))

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Courts in {cityName}</h1>
        {error && (
          <div className="text-destructive mb-4">Failed to load courts</div>
        )}
        {courts.length === 0 ? (
          <div className="text-muted-foreground">No courts found for this city.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courts.map(court => (
              <div key={court.id} className="rounded-lg border border-border p-4 bg-card">
                <div className="text-sm text-muted-foreground mb-1 capitalize">{court.type}</div>
                <div className="font-semibold mb-1">{court.name}</div>
                <div className="text-sm text-muted-foreground">{court.jurisdiction}</div>
                {court.address && (
                  <div className="text-xs text-muted-foreground mt-2">{String(court.address)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


