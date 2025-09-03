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
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              >
                <span>Browse</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md bg-card border border-border py-2 shadow-lg z-50">
                  <Link 
                    href="/judges" 
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    All Judges
                  </Link>
                  <Link 
                    href="/courts" 
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Courts
                  </Link>
                  <Link 
                    href="/jurisdictions" 
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Jurisdictions
                  </Link>
                </div>
              )}
            </div>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <ThemeToggle />
            <Link href="/search" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-5 w-5" />
            </Link>
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/dashboard" 
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
                <SafeUserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            ) : (
              <>
                <SafeSignInButton mode="modal">
                  <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                    <span>Login</span>
                  </button>
                </SafeSignInButton>
                <Link href="/sign-up">
                  <button className="rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep px-4 py-2 text-sm font-medium text-white hover:from-enterprise-accent hover:to-enterprise-primary shadow-md hover:shadow-lg transition-all">
                    For Professionals
                  </button>
                </Link>
              </>
            )}
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
            {/* Browse Section */}
            <div className="pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Browse</p>
              <Link 
                href="/judges" 
                className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Scale className="h-4 w-4 mr-3 text-primary" />
                All Judges
              </Link>
              <Link 
                href="/courts" 
                className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Building2 className="h-4 w-4 mr-3 text-primary" />
                Courts
              </Link>
              <Link 
                href="/search" 
                className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-4 w-4 mr-3 text-primary" />
                Advanced Search
              </Link>
            </div>

            {/* User Section */}
            {isSignedIn ? (
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
                <Link 
                  href="/dashboard" 
                  className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 mr-3 text-primary" />
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3 text-primary" />
                  Profile Settings
                </Link>
                <div className="mt-3">
                  <SafeUserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8"
                      }
                    }}
                    afterSignOutUrl="/"
                  />
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-border space-y-3">
                <SafeSignInButton mode="modal">
                  <button 
                    className="flex items-center w-full py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Login
                  </button>
                </SafeSignInButton>
                <Link href="/sign-up">
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 text-center font-medium text-white hover:from-blue-500 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    For Legal Professionals
                  </button>
                </Link>
              </div>
            )}

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
                href="/about" 
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/compare" 
                className="flex items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4 mr-3 text-primary" />
                Compare Judges
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}