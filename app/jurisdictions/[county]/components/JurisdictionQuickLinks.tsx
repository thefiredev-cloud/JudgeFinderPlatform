import Link from 'next/link'
import { JurisdictionMetadata } from '../types'

export interface JurisdictionQuickLinksProps {
  jurisdiction: JurisdictionMetadata
}

class JurisdictionQuickLinksView {
  constructor(private readonly props: JurisdictionQuickLinksProps) {}

  render(): JSX.Element {
    const { jurisdiction } = this.props

    return (
      <footer className="mt-16 bg-gradient-to-b from-[#0B1220] via-[#080F1C] to-[#050914] border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4">
              Explore More
            </h3>
            <p className="text-sm text-blue-100/70 mb-6">
              Continue your research with judge analytics or browse additional jurisdictions.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href={`/judges?jurisdiction=${encodeURIComponent(jurisdiction.jurisdictionValue)}`}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-blue-600/40"
              >
                View All {jurisdiction.displayName} Judges
              </Link>

              <Link
                href="/jurisdictions"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-blue-100/80 transition hover:border-blue-400/60 hover:text-white"
              >
                Browse Other Jurisdictions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    )
  }
}

export function JurisdictionQuickLinks(props: JurisdictionQuickLinksProps): JSX.Element {
  return new JurisdictionQuickLinksView(props).render()
}

