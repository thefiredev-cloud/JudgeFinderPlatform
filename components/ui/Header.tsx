'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, User, ChevronDown } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-blue-600" />
            <span className="text-xl font-bold text-white">JudgeFinder.io</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-8">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 text-gray-300 hover:text-white"
              >
                <span>Browse</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md bg-gray-800 py-2 shadow-lg">
                  <Link href="/judges" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    All Judges
                  </Link>
                  <Link href="/courts" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Courts
                  </Link>
                  <Link href="/jurisdictions" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                    Jurisdictions
                  </Link>
                </div>
              )}
            </div>
            <Link href="/analytics" className="text-gray-300 hover:text-white">
              Analytics
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white">
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <button className="p-2 text-gray-300 hover:text-white">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/login" className="flex items-center space-x-1 text-gray-300 hover:text-white">
              <User className="h-5 w-5" />
              <span>Login</span>
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
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
        <div className="md:hidden border-t border-gray-800 bg-gray-900">
          <nav className="space-y-1 px-4 py-4">
            <Link href="/judges" className="block py-2 text-gray-300 hover:text-white">
              All Judges
            </Link>
            <Link href="/courts" className="block py-2 text-gray-300 hover:text-white">
              Courts
            </Link>
            <Link href="/analytics" className="block py-2 text-gray-300 hover:text-white">
              Analytics
            </Link>
            <Link href="/pricing" className="block py-2 text-gray-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/about" className="block py-2 text-gray-300 hover:text-white">
              About
            </Link>
            <div className="pt-4 border-t border-gray-800">
              <Link href="/login" className="block py-2 text-gray-300 hover:text-white">
                Login
              </Link>
              <Link
                href="/signup"
                className="block mt-2 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}