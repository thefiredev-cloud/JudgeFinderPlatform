import Link from 'next/link'
import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">JudgeFinder.io</h3>
            <p className="mb-4 text-sm">
              Comprehensive legal analytics platform providing data-driven insights into judicial decisions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-foreground">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-foreground">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase text-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="mb-4 text-sm font-semibold uppercase text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm">
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
            <h4 className="mb-4 text-sm font-semibold uppercase text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
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

        <div className="mt-8 border-t border-border pt-8 text-center text-sm">
          <p>&copy; 2024 JudgeFinder.io. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}