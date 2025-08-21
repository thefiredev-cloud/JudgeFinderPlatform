'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { 
  Settings, 
  Database, 
  Users, 
  Shield, 
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalJudges: number
  totalCourts: number
  totalUsers: number
  pendingSync: number
  lastSyncTime: string
  systemHealth: 'healthy' | 'warning' | 'error'
  activeUsers: number
  searchVolume: number
}

interface SyncJob {
  id: string
  type: 'judges' | 'courts' | 'decisions'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  recordsProcessed: number
  errors: number
}

export default function AdminDashboard() {
  const { user } = useUser()
  const [stats, setStats] = useState<AdminStats>({
    totalJudges: 0,
    totalCourts: 0,
    totalUsers: 0,
    pendingSync: 0,
    lastSyncTime: '',
    systemHealth: 'healthy',
    activeUsers: 0,
    searchVolume: 0
  })
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      // Fetch admin statistics
      const [statsResponse, syncResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/sync-status')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (syncResponse.ok) {
        const syncData = await syncResponse.json()
        setSyncJobs(syncData.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async (type: 'judges' | 'courts' | 'decisions') => {
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        fetchAdminData() // Refresh data
      }
    } catch (error) {
      console.error('Error triggering sync:', error)
    }
  }

  const getHealthStatus = () => {
    switch (stats.systemHealth) {
      case 'healthy':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' }
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' }
      default:
        return { icon: CheckCircle, color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never'
    const now = new Date()
    const past = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Law Professional Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive judicial analytics and transparency tools for legal professionals
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link 
            href="/judges"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Browse Judges
          </Link>
          <Link 
            href="/courts"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Database className="h-4 w-4 mr-2" />
            View Courts
          </Link>
          <button
            onClick={() => fetchAdminData()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Judges</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJudges.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${healthStatus.bg}`}>
                <healthStatus.icon className={`h-6 w-6 ${healthStatus.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{stats.systemHealth}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Data Sync Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Data Synchronization</h2>
              <div className="text-sm text-gray-600">
                Last sync: {formatTimeAgo(stats.lastSyncTime)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Judge Data Sync</p>
                  <p className="text-sm text-gray-600">Sync from CourtListener API</p>
                </div>
                <button
                  onClick={() => triggerSync('judges')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sync Now
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Court Data Sync</p>
                  <p className="text-sm text-gray-600">Update court information</p>
                </div>
                <button
                  onClick={() => triggerSync('courts')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sync Now
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Decision Data Sync</p>
                  <p className="text-sm text-gray-600">Import recent decisions</p>
                </div>
                <button
                  onClick={() => triggerSync('decisions')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>

          {/* Recent Sync Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Sync Jobs</h2>
            
            <div className="space-y-4">
              {syncJobs.length > 0 ? (
                syncJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        job.status === 'completed' ? 'bg-green-100 text-green-600' :
                        job.status === 'failed' ? 'bg-red-100 text-red-600' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {job.status === 'running' ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{job.type} Sync</p>
                        <p className="text-sm text-gray-600">
                          {job.recordsProcessed} processed • {job.errors} errors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(job.startTime)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent sync jobs</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Health</h3>
              <p className="text-gray-600 mb-4">Monitor database performance and integrity</p>
              <Link 
                href="/admin/database"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Details
              </Link>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <Settings className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-600 mb-4">Configure platform settings and preferences</p>
              <Link 
                href="/admin/settings"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Settings
              </Link>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
              <Link 
                href="/admin/users"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}