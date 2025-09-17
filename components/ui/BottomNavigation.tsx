'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, BarChart3, Bookmark, User } from 'lucide-react'
import { useSafeUser } from '@/lib/auth/safe-clerk-components'
import { cn } from '@/lib/utils'

const BottomNavigation = () => {
  const pathname = usePathname()
  const { isSignedIn } = useSafeUser()
  
  const navItems = [
    { 
      name: 'Home', 
      href: '/', 
      icon: Home
    },
    { 
      name: 'Search', 
      href: '/search', 
      icon: Search
    },
    { 
      name: 'Insights', 
      href: '/judges', 
      icon: BarChart3
    },
    { 
      name: 'Saved', 
      href: isSignedIn ? '/dashboard' : '/auth/login', 
      icon: Bookmark
    },
    { 
      name: 'Account', 
      href: isSignedIn ? '/profile' : '/auth/login', 
      icon: User
    },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="safe-area-pb md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-3">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              className="flex flex-1 items-center justify-center"
            >
              <div
                className={cn(
                  'flex w-[64px] flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    active ? 'scale-105 text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
