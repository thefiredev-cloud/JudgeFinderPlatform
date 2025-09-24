'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  BookmarkIcon, 
  ClockIcon, 
  SearchIcon, 
  TrendingUpIcon,
  UserIcon,
  BuildingIcon,
  BarChart3Icon,
  StarIcon,
  Megaphone
} from 'lucide-react'
import AdPurchaseModal from './AdPurchaseModal'

interface SerializedUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  createdAt: number
}

interface UserDashboardProps {
  user: SerializedUser | null
}

interface DashboardStats {
  totalSearches: number
  judgesViewed: number
  bookmarkedJudges: number
  comparisonsRun: number
  recentActivity: number
  daysSinceJoin: number
  memberSince: string
}

interface ApiResponse {
  success: boolean
  stats: DashboardStats
  message: string
}

interface BookmarkJudge {
  id: string
  judge_id: string
  created_at: string
  judges: {
    id: string
    name: string
    court?: string | null
    court_name?: string | null
    jurisdiction?: string | null
    slug?: string | null
  }
}

interface ActivityEntry {
  id?: string
  activity_type: string
  created_at: string
  activity_data?: Record<string, any> | null
  search_query?: string | null
}

export function UserDashboard({ user }: UserDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    judgesViewed: 0,
    bookmarkedJudges: 0,
    comparisonsRun: 0,
    recentActivity: 0,
    daysSinceJoin: 0,
    memberSince: ''
  })
  const [loading, setLoading] = useState(true)
  const [showAdPurchaseModal, setShowAdPurchaseModal] = useState(false)
  const [savedLoading, setSavedLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(true)
  const [savedJudges, setSavedJudges] = useState<BookmarkJudge[]>([])
  const [recentSearches, setRecentSearches] = useState<ActivityEntry[]>([])

  const formattedMemberSince = useMemo(() => stats.memberSince || 'N/A', [stats.memberSince])

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (diffMs < 60_000) return 'Just now'
    const diffMinutes = Math.round(diffMs / 60_000)
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    async function fetchUserStats() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch('/api/user/stats')
        if (response.ok) {
          const data: ApiResponse = await response.json()
          if (data.success) {
            setStats(data.stats)
          }
        } else if (response.status === 401) {
          setStats(prev => ({ ...prev, memberSince: '', daysSinceJoin: 0 }))
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [user])

  useEffect(() => {
    let isMounted = true

    const fetchSavedJudges = async () => {
      if (!user) {
        if (isMounted) {
          setSavedJudges([])
          setSavedLoading(false)
        }
        return
      }

      try {
        setSavedLoading(true)
        const response = await fetch('/api/user/bookmarks')
        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          const bookmarks: BookmarkJudge[] = data.bookmarks || []
          setSavedJudges(bookmarks.slice(0, 3))
        } else if (response.status === 401) {
          setSavedJudges([])
        }
      } catch (error) {
        console.error('Failed to fetch saved judges:', error)
      } finally {
        if (isMounted) {
          setSavedLoading(false)
        }
      }
    }

    const fetchRecentSearches = async () => {
      if (!user) {
        if (isMounted) {
          setRecentSearches([])
          setSearchLoading(false)
        }
        return
      }

      try {
        setSearchLoading(true)
        const response = await fetch('/api/user/activity?limit=5&type=search')
        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          const activities: ActivityEntry[] = data.activity || []
          setRecentSearches(activities)
        } else if (response.status === 401) {
          setRecentSearches([])
        }
      } catch (error) {
        console.error('Failed to fetch recent searches:', error)
      } finally {
        if (isMounted) {
          setSearchLoading(false)
        }
      }
    }

    fetchSavedJudges()
    fetchRecentSearches()

    return () => {
      isMounted = false
    }
  }, [user])

  const renderSavedJudges = () => {
    if (savedLoading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map(key => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg animate-pulse">
              <div className="w-full space-y-2">
                <div className="h-4 bg-gray-600/60 rounded" />
                <div className="h-3 bg-gray-600/40 rounded w-1/2" />
              </div>
              <StarIcon className="h-5 w-5 text-gray-600" />
            </div>
          ))}
        </div>
      )
    }

    if (!savedJudges.length) {
      return (
        <div className="py-6 text-center text-sm text-gray-400">
          No saved judges yet. Bookmark judges to see them here.
        </div>
      )
    }

    return savedJudges.map(bookmark => {
      const judge = bookmark.judges
      const courtLabel = judge.court_name || judge.court || 'Court information unavailable'

      return (
        <div key={bookmark.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <p className="font-medium text-white">{judge.name}</p>
            <p className="text-sm text-gray-400">{courtLabel}</p>
          </div>
          <StarIcon className="h-5 w-5 text-yellow-400" />
        </div>
      )
    })
  }

  const renderRecentSearches = () => {
    if (searchLoading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map(key => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg animate-pulse">
              <div className="w-full space-y-2">
                <div className="h-4 bg-gray-600/60 rounded" />
                <div className="h-3 bg-gray-600/40 rounded w-1/2" />
              </div>
              <SearchIcon className="h-5 w-5 text-gray-600" />
            </div>
          ))}
        </div>
      )
    }

    if (!recentSearches.length) {
      return (
        <div className="py-6 text-center text-sm text-gray-400">
          No recent searches yet. Start exploring judges and courts to see them here.
        </div>
      )
    }

    return recentSearches.map((activity, index) => {
      const query = activity.search_query || activity.activity_data?.query || 'Search'
      const context = activity.activity_data?.context || activity.activity_data?.jurisdiction || activity.activity_data?.court_name || ''

      return (
        <div key={activity.id ?? index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div>
            <p className="font-medium text-white">{query}</p>
            <p className="text-sm text-gray-400">
              {context ? `${context} • ` : ''}{formatRelativeTime(activity.created_at)}
            </p>
          </div>
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
      )
    })
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookmarkIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Saved Judges</p>
              <p className="text-2xl font-bold text-white">{loading ? '...' : stats.bookmarkedJudges}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <SearchIcon className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Searches</p>
              <p className="text-2xl font-bold text-white">{loading ? '...' : stats.totalSearches}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUpIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Judges Viewed</p>
              <p className="text-2xl font-bold text-white">{loading ? '...' : stats.judgesViewed}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Days Active</p>
              <p className="text-2xl font-bold text-white">{loading ? '...' : stats.daysSinceJoin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Buy Ad Space - Featured Button */}
          <button
            onClick={() => setShowAdPurchaseModal(true)}
            className="flex items-center p-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg border border-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all transform hover:scale-105 group shadow-lg"
          >
            <Megaphone className="h-6 w-6 text-white mr-3" />
            <div className="text-left">
              <p className="font-medium text-white">Buy Ad Space</p>
              <p className="text-sm text-blue-100">Promote your firm on judge profiles</p>
            </div>
          </button>

          <Link
            href="/judges"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <UserIcon className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-blue-400">Browse Judges</p>
              <p className="text-sm text-gray-400">Explore California judges statewide</p>
            </div>
          </Link>

          <Link
            href="/courts"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <BuildingIcon className="h-6 w-6 text-green-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-green-400">Browse Courts</p>
              <p className="text-sm text-gray-400">Search courts across California</p>
            </div>
          </Link>

          <Link
            href="/search"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <SearchIcon className="h-6 w-6 text-blue-500 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-blue-500">Advanced Search</p>
              <p className="text-sm text-gray-400">Find specific judges and cases</p>
            </div>
          </Link>

          <Link
            href="/compare"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <BarChart3Icon className="h-6 w-6 text-orange-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-orange-400">Compare Judges</p>
              <p className="text-sm text-gray-400">Analyze judicial patterns</p>
            </div>
          </Link>

          <Link
            href="/profile"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-blue-600">My Profile</p>
              <p className="text-sm text-gray-400">Manage account settings</p>
            </div>
          </Link>

          <Link
            href="/dashboard/bookmarks"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <BookmarkIcon className="h-6 w-6 text-yellow-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-yellow-400">Saved Judges</p>
              <p className="text-sm text-gray-400">View bookmarked judges</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Judges */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recently Saved</h2>
            <Link href="/dashboard/bookmarks" className="text-blue-400 hover:text-blue-300 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {renderSavedJudges()}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Searches</h2>
            <Link href="/search" className="text-blue-400 hover:text-blue-300 text-sm">
              New Search
            </Link>
          </div>
          <div className="space-y-3">
            {renderRecentSearches()}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Email</p>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Member Since</p>
            <p className="text-white">
              {loading ? 'Loading...' : formattedMemberSince}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Account Type</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Free Account
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Last Login</p>
            <p className="text-white">Today</p>
          </div>
        </div>
      </div>
      
      {/* Ad Purchase Modal */}
      {showAdPurchaseModal && (
        <AdPurchaseModal
          onClose={() => setShowAdPurchaseModal(false)}
          userId={user?.id || ''}
        />
      )}
    </div>
  )
}
