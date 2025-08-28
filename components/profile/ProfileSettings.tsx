'use client'

import { useState } from 'react'
import { User } from '@clerk/nextjs/server'
import { 
  UserIcon, 
  MailIcon, 
  BellIcon, 
  ShieldCheckIcon,
  CreditCardIcon,
  DownloadIcon,
  TrashIcon
} from 'lucide-react'
import { useSafeUser } from '@/lib/auth/safe-clerk-components'

interface ProfileSettingsProps {
  user: User | null
}

export function ProfileSettings({ user: serverUser }: ProfileSettingsProps) {
  const { user: clientUser, isLoaded } = useSafeUser()
  const user = clientUser || serverUser

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    judgeAlerts: false,
    weeklyDigest: true,
    securityAlerts: true
  })

  const [preferences, setPreferences] = useState({
    defaultJurisdiction: 'CA',
    resultsPerPage: 20,
    darkMode: true,
    emailFrequency: 'weekly'
  })

  if (!isLoaded || !user) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center mb-6">
          <UserIcon className="h-6 w-6 text-blue-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={user.firstName || ''}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={user.lastName || ''}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.emailAddresses[0]?.emailAddress || ''}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              To change your profile information, click on your avatar in the header
            </p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center mb-6">
          <BellIcon className="h-6 w-6 text-green-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Updates</p>
              <p className="text-sm text-gray-400">Receive updates about new features and platform changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.emailUpdates}
                onChange={(e) => setNotifications({...notifications, emailUpdates: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Judge Alerts</p>
              <p className="text-sm text-gray-400">Get notified when saved judges have new cases or updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.judgeAlerts}
                onChange={(e) => setNotifications({...notifications, judgeAlerts: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Weekly Digest</p>
              <p className="text-sm text-gray-400">Weekly summary of judicial activity and platform updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={(e) => setNotifications({...notifications, weeklyDigest: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Security Alerts</p>
              <p className="text-sm text-gray-400">Important security notifications about your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.securityAlerts}
                onChange={(e) => setNotifications({...notifications, securityAlerts: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Platform Preferences */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-purple-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Platform Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Default Jurisdiction
            </label>
            <select
              value={preferences.defaultJurisdiction}
              onChange={(e) => setPreferences({...preferences, defaultJurisdiction: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Results Per Page
            </label>
            <select
              value={preferences.resultsPerPage}
              onChange={(e) => setPreferences({...preferences, resultsPerPage: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Frequency
            </label>
            <select
              value={preferences.emailFrequency}
              onChange={(e) => setPreferences({...preferences, emailFrequency: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center mb-6">
          <CreditCardIcon className="h-6 w-6 text-orange-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Account & Subscription</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <p className="text-white font-medium">Current Plan</p>
              <p className="text-sm text-gray-400">Free Account</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <p className="text-white font-medium">Member Since</p>
              <p className="text-sm text-gray-400">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <p className="text-white font-medium">Account ID</p>
              <p className="text-sm text-gray-400 font-mono">{user.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
        <div className="flex items-center mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-red-400 mr-3" />
          <h2 className="text-xl font-semibold text-white">Data & Privacy</h2>
        </div>

        <div className="space-y-4">
          <button className="flex items-center justify-between w-full p-4 bg-gray-700/30 rounded-lg hover:bg-gray-600/30 transition-colors">
            <div className="flex items-center">
              <DownloadIcon className="h-5 w-5 text-blue-400 mr-3" />
              <div className="text-left">
                <p className="text-white font-medium">Download Your Data</p>
                <p className="text-sm text-gray-400">Export all your saved data and preferences</p>
              </div>
            </div>
          </button>

          <button className="flex items-center justify-between w-full p-4 bg-gray-700/30 rounded-lg hover:bg-red-600/20 transition-colors group">
            <div className="flex items-center">
              <TrashIcon className="h-5 w-5 text-red-400 mr-3" />
              <div className="text-left">
                <p className="text-white font-medium group-hover:text-red-400">Delete Account</p>
                <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg">
          Save Changes
        </button>
      </div>
    </div>
  )
}