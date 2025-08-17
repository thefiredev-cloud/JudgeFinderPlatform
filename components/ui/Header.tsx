'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, User, ChevronDown } from 'lucide-react'
import { CountySelector } from './CountySelector'
import NavLogo from './NavLogo'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
                    <div className="hidden lg:flex lg:items-center lg:ml-6">
            <CountySelector />
          </div>
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
              className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
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
            <Link href="/jurisdictions" className="block py-2 text-gray-300 hover:text-white">
              Jurisdictions
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
                className="block mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-center font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
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