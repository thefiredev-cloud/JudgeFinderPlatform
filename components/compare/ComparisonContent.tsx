'use client'

import { useState, useEffect } from 'react'
import { Search, X, Scale, Users, TrendingUp, BarChart, Calendar, MapPin, Gavel, Loader2 } from 'lucide-react'
import { useSearchDebounce } from '@/lib/hooks/useDebounce'
import type { Judge } from '@/types'

interface ComparisonContentProps {
  initialJudges?: Judge[]
}

export function ComparisonContent({ initialJudges = [] }: ComparisonContentProps) {
  const [selectedJudges, setSelectedJudges] = useState<Judge[]>(initialJudges)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Judge[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [analytics, setAnalytics] = useState<Record<string, any>>({})
  const [loadingAnalytics, setLoadingAnalytics] = useState<Record<string, boolean>>({})

  const { debouncedSearchQuery } = useSearchDebounce(searchQuery, 300)

  // Search for judges
  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const searchJudges = async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/judges/list?q=${encodeURIComponent(debouncedSearchQuery)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.judges || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }

    searchJudges()
  }, [debouncedSearchQuery])

  // Fetch analytics for selected judges
  useEffect(() => {
    selectedJudges.forEach(judge => {
      if (!analytics[judge.id] && !loadingAnalytics[judge.id]) {
        fetchJudgeAnalytics(judge.id)
      }
    })
  }, [selectedJudges, analytics, loadingAnalytics])

  const fetchJudgeAnalytics = async (judgeId: string) => {
    setLoadingAnalytics(prev => ({ ...prev, [judgeId]: true }))
    try {
      const response = await fetch(`/api/judges/${judgeId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(prev => ({ ...prev, [judgeId]: data }))
      }
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoadingAnalytics(prev => ({ ...prev, [judgeId]: false }))
    }
  }

  const addJudge = (judge: Judge) => {
    if (selectedJudges.length < 3 && !selectedJudges.find(j => j.id === judge.id)) {
      setSelectedJudges([...selectedJudges, judge])
      setSearchQuery('')
      setSearchResults([])
      setShowSearch(false)
    }
  }

  const removeJudge = (judgeId: string) => {
    setSelectedJudges(selectedJudges.filter(j => j.id !== judgeId))
    const newAnalytics = { ...analytics }
    delete newAnalytics[judgeId]
    setAnalytics(newAnalytics)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available'
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return 'Not available'
    }
  }

  const getExperience = (appointedDate: string | null) => {
    if (!appointedDate) return 'N/A'
    try {
      const years = new Date().getFullYear() - new Date(appointedDate).getFullYear()
      return `${years} years`
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Add Judge Section */}
      <div className="mb-8">
        {selectedJudges.length < 3 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Select Judges to Compare</h2>
            <p className="text-muted-foreground mb-4">
              You can compare up to 3 judges. Currently comparing {selectedJudges.length} judge{selectedJudges.length !== 1 ? 's' : ''}.
            </p>
            
            {!showSearch ? (
              <button
                onClick={() => setShowSearch(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Judge
              </button>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a judge..."
                  className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                {searchResults.map(judge => (
                  <button
                    key={judge.id}
                    onClick={() => addJudge(judge)}
                    disabled={selectedJudges.find(j => j.id === judge.id) !== undefined}
                    className="w-full px-4 py-3 text-left hover:bg-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium">{judge.name}</div>
                    <div className="text-sm text-muted-foreground">{judge.court_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selectedJudges.length > 0 ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Attribute</th>
                  {selectedJudges.map(judge => (
                    <th key={judge.id} className="px-6 py-4 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{judge.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{judge.court_name}</div>
                        </div>
                        <button
                          onClick={() => removeJudge(judge.id)}
                          className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Basic Information */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Jurisdiction
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {judge.jurisdiction || 'Not specified'}
                    </td>
                  ))}
                </tr>
                
                <tr className="bg-muted/30">
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Appointed Date
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {formatDate(judge.appointed_date)}
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Experience
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {getExperience(judge.appointed_date)}
                    </td>
                  ))}
                </tr>
                
                <tr className="bg-muted/30">
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      Total Cases
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {judge.total_cases ? judge.total_cases.toLocaleString() : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Analytics Section */}
                <tr className="bg-primary/5">
                  <td colSpan={selectedJudges.length + 1} className="px-6 py-3 text-sm font-semibold">
                    AI Analytics & Bias Detection
                  </td>
                </tr>

                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Consistency Score
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {loadingAnalytics[judge.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : analytics[judge.id]?.metrics?.consistency ? (
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold">{analytics[judge.id].metrics.consistency}%</div>
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${analytics[judge.id].metrics.consistency}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="bg-muted/30">
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Speed Score
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {loadingAnalytics[judge.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : analytics[judge.id]?.metrics?.speed ? (
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold">{analytics[judge.id].metrics.speed}%</div>
                          <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${analytics[judge.id].metrics.speed}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Overall Bias Score
                    </div>
                  </td>
                  {selectedJudges.map(judge => (
                    <td key={judge.id} className="px-6 py-4">
                      {loadingAnalytics[judge.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : analytics[judge.id]?.overall_bias_score ? (
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold">{analytics[judge.id].overall_bias_score}</div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            analytics[judge.id].overall_bias_score >= 80 ? 'bg-green-100 text-green-800' :
                            analytics[judge.id].overall_bias_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {analytics[judge.id].overall_bias_score >= 80 ? 'Low Bias' :
                             analytics[judge.id].overall_bias_score >= 60 ? 'Moderate' : 'High Bias'}
                          </span>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Judges Selected</h3>
          <p className="text-muted-foreground">
            Start by adding judges to compare their profiles and analytics side-by-side.
          </p>
        </div>
      )}
    </div>
  )
}
