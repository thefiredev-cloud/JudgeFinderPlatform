'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, Search } from 'lucide-react'
import { SafeSignInButton, SafeUserButton, useSafeUser } from '@/lib/auth/safe-clerk-components'
import NavLogo from './NavLogo'
import { ThemeToggle } from './ThemeToggle'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/judges', label: 'Judges' },
  { href: '/courts', label: 'Courts' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/about', label: 'About' },
  { href: '/docs', label: 'Docs' },
  { href: '/help', label: 'Resources' },
]

export function Header() {
  const pathname = usePathname()
  const { isSignedIn } = useSafeUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <NavLogo />
          <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative inline-flex items-center text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex md:items-center md:gap-3">
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-2 text-muted-foreground hover:text-foreground'
            )}
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          <ThemeToggle />
          {isSignedIn ? (
            <SafeUserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { width: '32px', height: '32px' } } }} />
          ) : (
            <SafeSignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <span
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'cursor-pointer'
                )}
              >
                Sign in
              </span>
            </SafeSignInButton>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle navigation</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden',
          isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        )}
      >
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={closeMenu}
        />
        <div
          id="mobile-navigation"
          className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background px-4 pb-10 shadow-xl"
        >
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6" aria-label="Mobile navigation">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-muted-foreground">Quick actions</span>
              <ThemeToggle />
            </div>
            <Link
              href="/search"
              onClick={closeMenu}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'justify-between text-base'
              )}
            >
              Start a search
              <Search className="h-4 w-4" />
            </Link>
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={cn(
                    'rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors',
                    isActive(href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-6">
              {isSignedIn ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account</span>
                  <SafeUserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { width: '36px', height: '36px' } } }} />
                </div>
              ) : (
                <SafeSignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
                  <span
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'cursor-pointer'
                    )}
                  >
                    Sign in to personalize
                  </span>
                </SafeSignInButton>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
