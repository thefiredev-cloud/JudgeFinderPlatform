import { Loader2, Building } from 'lucide-react'
import { CourtCard } from './CourtCard'
import { CourtInfo } from '../types'

export interface CourtsGridSectionProps {
  courts: CourtInfo[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

class CourtsGridSectionView {
  constructor(private readonly props: CourtsGridSectionProps) {}

  private renderLoadingState(): JSX.Element {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-blue-100/70">
        <Loader2 className="h-10 w-10 animate-spin text-blue-300 mb-4" />
        <p>Loading courts...</p>
      </div>
    )
  }

  private renderEmptyState(): JSX.Element {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-blue-100/70 text-center">
        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Building className="h-8 w-8 text-blue-300" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No courts found</h3>
        <p className="text-sm text-blue-100/60 max-w-sm">
          Try adjusting your search term or explore other jurisdictions to discover more courts.
        </p>
      </div>
    )
  }

  private renderGrid(): JSX.Element {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {this.props.courts.map((court) => (
          <CourtCard key={court.id} court={court} />
        ))}
      </div>
    )
  }

  private renderLoadMore(): JSX.Element | null {
    const { hasMore, loading } = this.props
    if (!hasMore) {
      return null
    }

    return (
      <div className="flex justify-center mt-10">
        <button
          onClick={this.props.onLoadMore}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-blue-600/40 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Loading…' : 'Load More Courts'}
        </button>
      </div>
    )
  }

  render(): JSX.Element {
    const { loading, courts } = this.props

    if (loading && courts.length === 0) {
      return this.renderLoadingState()
    }

    if (!loading && courts.length === 0) {
      return this.renderEmptyState()
    }

    return (
      <div className="space-y-12">
        {this.renderGrid()}
        {this.renderLoadMore()}
      </div>
    )
  }
}

export function CourtsGridSection(props: CourtsGridSectionProps): JSX.Element {
  return new CourtsGridSectionView(props).render()
}

export const renderCourtsGridSection = (
  props: CourtsGridSectionProps
): JSX.Element => CourtsGridSection(props)

