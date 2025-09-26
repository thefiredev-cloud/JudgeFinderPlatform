import { Search, Loader2 } from 'lucide-react'
import { ChangeEvent } from 'react'
import { JurisdictionMetadata } from '../types'

export interface JurisdictionSearchPanelProps {
  jurisdiction: JurisdictionMetadata
  searchValue: string
  totalCourts: number
  visibleCourts: number
  loading: boolean
  onSearchChange: (value: string) => void
}

class JurisdictionSearchPanelView {
  constructor(private readonly props: JurisdictionSearchPanelProps) {}

  private handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.props.onSearchChange(event.target.value)
  }

  render(): JSX.Element {
    const { jurisdiction, searchValue, totalCourts, visibleCourts, loading } = this.props

    return (
      <section className="relative -mt-10 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#0C1424] border border-white/5 shadow-[0_20px_60px_-25px_rgba(15,118,255,0.35)] p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-blue-200/70">Search Courts</p>
                <h2 className="text-2xl font-semibold text-white">
                  Explore Courts in {jurisdiction.displayName}
                </h2>
              </div>

              <label className="block">
                <span className="text-sm text-blue-100/70">Search by court name</span>
                <div className="mt-2 relative flex items-center">
                  <Search className="absolute left-4 h-4 w-4 text-blue-200/60" />
                  <input
                    type="search"
                    value={searchValue}
                    onChange={this.handleInputChange}
                    placeholder="Los Angeles Superior Court..."
                    className="w-full rounded-xl border border-white/10 bg-[#0E182A] px-10 py-3 text-sm text-white placeholder:text-blue-100/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                  />
                </div>
              </label>

              <div className="rounded-xl border border-white/10 bg-[#0E182A]/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-blue-100/80">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-200" />
                      Loading courts...
                    </span>
                  ) : (
                    <span>
                      Found {totalCourts.toLocaleString()} courts in {jurisdiction.displayName}
                    </span>
                  )}
                </div>

                {!loading && totalCourts > 0 && (
                  <span className="text-xs font-medium text-blue-100/70">
                    Showing {visibleCourts.toLocaleString()} of {totalCourts.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

export function JurisdictionSearchPanel(props: JurisdictionSearchPanelProps): JSX.Element {
  return new JurisdictionSearchPanelView(props).render()
}

export const renderJurisdictionSearchPanel = (
  props: JurisdictionSearchPanelProps
): JSX.Element => JurisdictionSearchPanel(props)

