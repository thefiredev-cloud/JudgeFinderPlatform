'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t border-border pb-20 md:pb-0">
      {/* Simplified Footer */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-foreground">JudgeFinder.io</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Find information about your assigned judge
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex items-center justify-center md:justify-end gap-4 md:gap-6">
            <Link href="/privacy" className="text-xs hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-xs hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; 2024 JudgeFinder.io. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}