'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Target, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings,
  HelpCircle,
  LogOut,
  Megaphone,
  Users,
  TrendingUp
} from 'lucide-react'
import { SafeSignOutButton } from '@/lib/auth/safe-clerk-components'

const navigation = [
  { name: 'Overview', href: '/dashboard/advertiser', icon: Home },
  { name: 'Campaigns', href: '/dashboard/advertiser/campaigns', icon: Megaphone },
  { name: 'Ad Spots', href: '/dashboard/advertiser/ad-spots', icon: Target },
  { name: 'Bookings', href: '/dashboard/advertiser/bookings', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/advertiser/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/dashboard/advertiser/billing', icon: CreditCard },
]

const bottomNav = [
  { name: 'Settings', href: '/dashboard/advertiser/settings', icon: Settings },
  { name: 'Help & Support', href: '/dashboard/advertiser/support', icon: HelpCircle },
]

export default function AdvertiserSidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">JudgeFinder</h2>
            <p className="text-xs text-gray-400">Advertiser Portal</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/dashboard/advertiser' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-800 px-3 py-4">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
          
          {/* Sign Out */}
          <SafeSignOutButton>
            <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white">
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </SafeSignOutButton>
        </div>

        {/* User Info */}
        <div className="border-t border-gray-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              <Users className="h-4 w-4 text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Advertiser Account</p>
              <p className="text-xs text-gray-400 truncate">Manage your campaigns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}