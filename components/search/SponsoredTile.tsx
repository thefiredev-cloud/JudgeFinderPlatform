import Link from 'next/link'
import { ExternalLink, Shield } from 'lucide-react'
import type { SponsoredSearchResult } from '@/types/search'

interface SponsoredTileProps {
  tile: SponsoredSearchResult
}

export function SponsoredTile({ tile }: SponsoredTileProps) {
  const barUrl = tile.bar_number ? `https://apps.calbar.ca.gov/attorney/Licensee/Detail/${tile.bar_number}` : null

  return (
    <div className="rounded-lg border border-yellow-400/40 bg-yellow-500/10 p-5 text-sm text-yellow-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-yellow-300">
          <span className="rounded-full border border-yellow-400/40 px-3 py-1">Ad</span>
          <span>Sponsored Placement</span>
        </div>
        {tile.promo_badge && (
          <span className="rounded-full border border-yellow-400/40 bg-yellow-500/20 px-3 py-1 text-xs font-semibold">
            {tile.promo_badge}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-yellow-100">{tile.title}</h3>
          {tile.description && <p className="mt-1 text-yellow-200/90">{tile.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-yellow-200/80">
            {tile.verified && barUrl && (
              <Link
                href={barUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline-offset-4 hover:text-yellow-50"
              >
                <Shield className="h-3 w-3" /> CA Bar #{tile.bar_number}
              </Link>
            )}
            <span>Verified by JudgeFinder</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          {tile.contact_phone && <span className="text-sm text-yellow-100">{tile.contact_phone}</span>}
          {tile.contact_email && (
            <a
              href={`mailto:${tile.contact_email}`}
              className="text-sm text-yellow-100 underline-offset-4 hover:text-yellow-50"
            >
              {tile.contact_email}
            </a>
          )}
          {tile.website && (
            <Link
              href={tile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-100 hover:text-yellow-50"
            >
              Visit site
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
