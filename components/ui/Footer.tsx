'use client'

import Link from 'next/link'

export function Footer() {
  const popularCounties = [
    'Los Angeles', 'Orange', 'San Diego', 'San Bernardino', 
    'Riverside', 'Santa Clara'
  ]
  
  return (
    <footer className="bg-muted/50 text-muted-foreground border-t border-border pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* SEO-Optimized Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Find Judges</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/judges" className="text-xs hover:text-foreground transition-colors">
                  All CA Judges
                </Link>
              </li>
              <li>
                <Link href="/compare" className="text-xs hover:text-foreground transition-colors">
                  Compare Judges
                </Link>
              </li>
              <li>
                <Link href="/courts" className="text-xs hover:text-foreground transition-colors">
                  Courts Directory
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Popular Counties */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Top Counties</h3>
            <ul className="space-y-1">
              {popularCounties.slice(0, 3).map(county => (
                <li key={county}>
                  <Link 
                    href={`/jurisdictions/${county.toLowerCase().replace(/\s+/g, '-')}-county`}
                    className="text-xs hover:text-foreground transition-colors"
                  >
                    {county} County
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Resources</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/about" className="text-xs hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-xs hover:text-foreground transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-xs hover:text-foreground transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">Legal</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/privacy" className="text-xs hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-xs hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-xs hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* SEO Description */}
        <div className="text-center py-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">
            JudgeFinder.io - Research California judges with AI-powered analytics and bias detection
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} JudgeFinder. Free judicial transparency for California citizens.
          </p>
        </div>
      </div>
    </footer>
  )
}
