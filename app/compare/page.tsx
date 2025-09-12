import Link from 'next/link'
import { Scale, ArrowLeft, Users, TrendingUp, BarChart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/judges" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Judges
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Judge Comparison Tool</h1>
            <p className="text-xl text-muted-foreground">
              Compare judicial profiles, decision patterns, and analytics side-by-side
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
              <p className="text-muted-foreground mb-8">
                Our advanced judge comparison tool is currently under development. 
                You'll soon be able to compare up to 3 judges simultaneously with detailed analytics.
              </p>

              {/* Feature Preview */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Side-by-Side Profiles</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare judge backgrounds, experience, and jurisdictions
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Decision Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze ruling patterns and case outcome trends
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <BarChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Bias Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered bias analysis and pattern recognition
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Link 
                  href="/judges"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Browse Judges
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}