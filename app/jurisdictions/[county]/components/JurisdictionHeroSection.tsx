import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { JurisdictionMetadata } from '../types'

export interface JurisdictionHeroSectionProps {
  jurisdiction: JurisdictionMetadata
  totalCourts: number
  totalJudges: number
}

class JurisdictionHeroSectionView {
  constructor(private readonly props: JurisdictionHeroSectionProps) {}

  render(): JSX.Element {
    const { jurisdiction, totalCourts, totalJudges } = this.props

    return (
      <header className="relative overflow-hidden bg-gradient-to-b from-[#0B1220] via-[#0B142A] to-[#060B18] border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.35),_transparent_70%)] opacity-60" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="mb-8">
            <Link
              href="/jurisdictions"
              className="inline-flex items-center text-sm font-medium text-blue-200 hover:text-white/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Jurisdictions
            </Link>
          </div>

          <div className="text-center lg:text-left lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className="uppercase tracking-[0.35em] text-xs text-blue-200/80 mb-4">
                {jurisdiction.displayName}
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
                {jurisdiction.displayName} Courts
              </h1>
              <p className="text-base sm:text-lg text-blue-100/80 leading-relaxed">
                {jurisdiction.description}
              </p>
            </div>

            <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row items-center gap-4">
              {totalCourts > 0 && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
                  {totalCourts.toLocaleString()} Courts
                </span>
              )}
              {totalJudges > 0 && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20">
                  {totalJudges.toLocaleString()} Judges
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }
}

export function JurisdictionHeroSection(props: JurisdictionHeroSectionProps): JSX.Element {
  return new JurisdictionHeroSectionView(props).render()
}

