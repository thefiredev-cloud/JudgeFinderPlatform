'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, BarChart3, Bookmark, User } from 'lucide-react'
import { useSafeUser } from '@/lib/auth/safe-clerk-components'

const BottomNavigation = () => {
  const pathname = usePathname()
  const { isSignedIn } = useSafeUser()
  
  const navItems = [
    { 
      name: 'Home', 
      href: '/', 
      icon: Home,
      activeGradient: 'from-blue-600 to-blue-700'
    },
    { 
      name: 'Search', 
      href: '/search', 
      icon: Search,
      activeGradient: 'from-blue-600 to-blue-700'
    },
    { 
      name: 'Insights', 
      href: '/judges', 
      icon: BarChart3,
      activeGradient: 'from-blue-600 to-blue-700'
    },
    { 
      name: 'Saved', 
      href: isSignedIn ? '/dashboard' : '/sign-in', 
      icon: Bookmark,
      activeGradient: 'from-blue-600 to-blue-700'
    },
    { 
      name: 'Account', 
      href: isSignedIn ? '/profile' : '/sign-in', 
      icon: User,
      activeGradient: 'from-blue-600 to-blue-700'
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center 
                min-w-[64px] h-full px-2
                transition-all duration-200
                ${active ? 'scale-105' : 'scale-100'}
              `}
            >
              <div 
                className={`
                  flex items-center justify-center 
                  w-12 h-12 rounded-xl
                  transition-all duration-200
                  ${active 
                    ? `bg-gradient-to-r ${item.activeGradient} shadow-lg` 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <item.icon 
                  className={`
                    w-5 h-5 
                    ${active 
                      ? 'text-white' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span 
                className={`
                  text-xs mt-1 font-medium
                  ${active 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation