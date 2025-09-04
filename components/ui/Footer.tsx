'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Facebook, Twitter, Linkedin, Mail, ChevronDown, ChevronUp } from 'lucide-react'

export function Footer() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <footer className="bg-muted/50 text-muted-foreground border-t border-border pb-20 md:pb-0">
      {/* Mobile Footer - Accordion Style */}
      <div className="md:hidden">
        <div className="px-4 py-6">
          {/* Company Info - Always Visible on Mobile */}
          <div className="mb-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">JudgeFinder.io</h3>
            <p className="text-xs text-muted-foreground mb-4">
              AI-powered judicial analytics for California
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="p-2 hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-2">
            {/* Product Section */}
            <div className="border-t border-border/50">
              <button
                onClick={() => toggleSection('product')}
                className="w-full py-3 flex items-center justify-between text-sm font-medium"
              >
                <span>Product</span>
                {expandedSection === 'product' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSection === 'product' && (
                <div className="pb-3 space-y-2">
                  <Link href="/features" className="block py-2 text-sm hover:text-foreground">
                    Features
                  </Link>
                  <Link href="/pricing" className="block py-2 text-sm hover:text-foreground">
                    Pricing
                  </Link>
                  <Link href="/api" className="block py-2 text-sm hover:text-foreground">
                    API Access
                  </Link>
                  <Link href="/integrations" className="block py-2 text-sm hover:text-foreground">
                    Integrations
                  </Link>
                </div>
              )}
            </div>

            {/* Resources Section */}
            <div className="border-t border-border/50">
              <button
                onClick={() => toggleSection('resources')}
                className="w-full py-3 flex items-center justify-between text-sm font-medium"
              >
                <span>Resources</span>
                {expandedSection === 'resources' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSection === 'resources' && (
                <div className="pb-3 space-y-2">
                  <Link href="/docs" className="block py-2 text-sm hover:text-foreground">
                    Documentation
                  </Link>
                  <Link href="/blog" className="block py-2 text-sm hover:text-foreground">
                    Blog
                  </Link>
                  <Link href="/case-studies" className="block py-2 text-sm hover:text-foreground">
                    Case Studies
                  </Link>
                  <Link href="/support" className="block py-2 text-sm hover:text-foreground">
                    Support
                  </Link>
                </div>
              )}
            </div>

            {/* Legal Section */}
            <div className="border-t border-border/50">
              <button
                onClick={() => toggleSection('legal')}
                className="w-full py-3 flex items-center justify-between text-sm font-medium"
              >
                <span>Legal</span>
                {expandedSection === 'legal' ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {expandedSection === 'legal' && (
                <div className="pb-3 space-y-2">
                  <Link href="/privacy" className="block py-2 text-sm hover:text-foreground">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="block py-2 text-sm hover:text-foreground">
                    Terms of Service
                  </Link>
                  <Link href="/cookies" className="block py-2 text-sm hover:text-foreground">
                    Cookie Policy
                  </Link>
                  <Link href="/compliance" className="block py-2 text-sm hover:text-foreground">
                    Compliance
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Copyright - Mobile */}
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              &copy; 2024 JudgeFinder.io. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Footer - Original Grid Layout */}
      <div className="hidden md:block container mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-foreground">JudgeFinder.io</h3>
            <p className="mb-4 text-xs sm:text-sm leading-relaxed">
              Comprehensive legal analytics platform providing data-driven insights into judicial decisions.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#" className="hover:text-foreground transition-colors p-1">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="hover:text-foreground transition-colors p-1">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="hover:text-foreground transition-colors p-1">
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a href="#" className="hover:text-foreground transition-colors p-1">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase text-foreground">Product</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/features" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-foreground">
                  API Access
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-foreground">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase text-foreground">Resources</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/docs" className="hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="hover:text-foreground">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-foreground">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase text-foreground">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-foreground">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t border-border pt-6 sm:pt-8 text-center text-xs sm:text-sm">
          <p>&copy; 2024 JudgeFinder.io. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}