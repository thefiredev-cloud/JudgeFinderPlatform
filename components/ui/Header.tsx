'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, User, ChevronDown, Scale, Building2, BarChart3, Home, Settings } from 'lucide-react'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import NavLogo from './NavLogo'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { isSignedIn, user } = useUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/75">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLogo />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-8">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 text-gray-300 hover:text-white"
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              >
                <span>Browse</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md bg-gray-800 py-2 shadow-lg z-50">
                  <Link 
                    href="/judges" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    All Judges
                  </Link>
                  <Link 
                    href="/courts" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Courts
                  </Link>
                  <Link 
                    href="/jurisdictions" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Jurisdictions
                  </Link>
                </div>
              )}
            </div>
            <Link href="/about" className="text-gray-300 hover:text-white">
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/search" className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </Link>
            {isSignedIn ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/dashboard" 
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Dashboard"
                >
                  <Home className="h-5 w-5" />
                </Link>
                <UserButton 
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
                <SignInButton mode="modal">
                  <button className="flex items-center space-x-1 text-gray-300 hover:text-white">
                    <User className="h-5 w-5" />
                    <span>Login</span>
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-md">
          <nav className="space-y-1 px-4 py-4">
            {/* Browse Section */}
            <div className="pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Browse</p>
              <Link 
                href="/judges" 
                className="flex items-center py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Scale className="h-4 w-4 mr-3 text-blue-400" />
                All Judges
              </Link>
              <Link 
                href="/courts" 
                className="flex items-center py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Building2 className="h-4 w-4 mr-3 text-green-400" />
                Courts
              </Link>
              <Link 
                href="/search" 
                className="flex items-center py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-4 w-4 mr-3 text-purple-400" />
                Advanced Search
              </Link>
            </div>

            {/* User Section */}
            {isSignedIn ? (
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                <Link 
                  href="/dashboard" 
                  className="flex items-center py-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-4 w-4 mr-3 text-blue-400" />
                  Dashboard
                </Link>
                <Link 
                  href="/profile" 
                  className="flex items-center py-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3 text-purple-400" />
                  Profile Settings
                </Link>
                <div className="mt-3">
                  <UserButton 
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
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <SignInButton mode="modal">
                  <button 
                    className="flex items-center w-full py-2 text-gray-300 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Login
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 text-center font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            )}

            {/* Additional Links */}
            <div className="pt-4 border-t border-gray-700">
              <Link 
                href="/about" 
                className="block py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/compare" 
                className="flex items-center py-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4 mr-3 text-orange-400" />
                Compare Judges
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}