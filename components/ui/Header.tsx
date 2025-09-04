'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, User, ChevronDown, Scale, Building2, BarChart3, LayoutDashboard, Settings } from 'lucide-react'
import { SafeSignInButton, SafeUserButton, useSafeUser } from '@/lib/auth/safe-clerk-components'
import NavLogo from './NavLogo'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { isSignedIn, user } = useSafeUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLogo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/help" className="text-muted-foreground hover:text-foreground">
              Help
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <ThemeToggle />
            <Link href="/search" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-5 w-5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-transform duration-200 ease-in-out"
            style={{ transform: isMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md absolute top-16 left-0 right-0 z-50 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="space-y-1 px-4 py-4">
            {/* Search Section */}
            <div className="pb-2">
              <Link 
                href="/search" 
                className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-4 w-4 mr-3 text-primary" />
                Search for Judge
              </Link>
            </div>


            {/* Theme Toggle */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Additional Links */}
            <div className="pt-4 border-t border-border">
              <Link 
                href="/help" 
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Help
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}