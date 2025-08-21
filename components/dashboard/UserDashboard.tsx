'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from '@clerk/nextjs/server'
import { 
  BookmarkIcon, 
  ClockIcon, 
  SearchIcon, 
  TrendingUpIcon,
  UserIcon,
  BuildingIcon,
  BarChart3Icon,
  StarIcon
} from 'lucide-react'

interface UserDashboardProps {
  user: User | null
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

  useEffect(() => {
    async function fetchUserStats() {
      if (!user) return

      try {
        setLoading(true)
        const response = await fetch('/api/user/stats')
        
        if (response.ok) {
          const data: ApiResponse = await response.json()
          if (data.success) {
            setStats(data.stats)
          }
        } else {
          // Fallback to mock data if API fails
          const joinedDate = user.createdAt ? new Date(user.createdAt) : new Date()
          const daysSinceJoin = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24))
          
          setStats({
            totalSearches: 8,
            judgesViewed: 47,
            bookmarkedJudges: 12,
            comparisonsRun: 3,
            recentActivity: 15,
            daysSinceJoin,
            memberSince: joinedDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          })
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [user])

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
              <TrendingUpIcon className="h-8 w-8 text-purple-400" />
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
          <Link
            href="/judges"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <UserIcon className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-blue-400">Browse Judges</p>
              <p className="text-sm text-gray-400">Explore 1,810+ California judges</p>
            </div>
          </Link>

          <Link
            href="/courts"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <BuildingIcon className="h-6 w-6 text-green-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-green-400">Browse Courts</p>
              <p className="text-sm text-gray-400">Search 909 courts statewide</p>
            </div>
          </Link>

          <Link
            href="/search"
            className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
          >
            <SearchIcon className="h-6 w-6 text-purple-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-purple-400">Advanced Search</p>
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
            <UserIcon className="h-6 w-6 text-pink-400 mr-3" />
            <div>
              <p className="font-medium text-white group-hover:text-pink-400">My Profile</p>
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
            {/* Mock data - will be replaced with real data */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Hon. Sarah Johnson</p>
                <p className="text-sm text-gray-400">Superior Court of Orange County</p>
              </div>
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Hon. Michael Chen</p>
                <p className="text-sm text-gray-400">Los Angeles Superior Court</p>
              </div>
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Hon. Lisa Rodriguez</p>
                <p className="text-sm text-gray-400">San Diego Superior Court</p>
              </div>
              <StarIcon className="h-5 w-5 text-yellow-400" />
            </div>
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
            {/* Mock data - will be replaced with real data */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Family Law Judges</p>
                <p className="text-sm text-gray-400">Orange County • 2 hours ago</p>
              </div>
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Criminal Defense</p>
                <p className="text-sm text-gray-400">Los Angeles • Yesterday</p>
              </div>
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <p className="font-medium text-white">Civil Litigation</p>
                <p className="text-sm text-gray-400">San Francisco • 3 days ago</p>
              </div>
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Email</p>
            <p className="text-white">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Member Since</p>
            <p className="text-white">
              {loading ? 'Loading...' : (stats.memberSince || 'N/A')}
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
    </div>
  )
}