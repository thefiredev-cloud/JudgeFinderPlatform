import Link from 'next/link'
import { BarChart3, ArrowLeft, TrendingUp, Activity, PieChart, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
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
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Platform Analytics</h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive judicial data insights and trends across California courts
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Analytics Dashboard Coming Soon</h2>
              <p className="text-muted-foreground mb-8">
                We're building a comprehensive analytics platform to provide insights into judicial patterns, 
                court performance metrics, and statewide legal trends.
              </p>

              {/* Feature Preview */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="text-left p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Judicial Trends</h3>
                  <p className="text-sm text-muted-foreground">
                    Track decision patterns and ruling trends across different jurisdictions and time periods
                  </p>
                </div>
                <div className="text-left p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Court Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor case processing times, reversal rates, and efficiency metrics by court
                  </p>
                </div>
                <div className="text-left p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <PieChart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Case Distribution</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze case type distributions and outcomes across different judges and courts
                  </p>
                </div>
                <div className="text-left p-4 border border-border rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Attorney Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Success rates and appearance statistics for attorneys by judge and court
                  </p>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="grid grid-cols-3 gap-4 mt-8 p-6 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1,810</div>
                  <div className="text-sm text-muted-foreground">Total Judges</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">300K+</div>
                  <div className="text-sm text-muted-foreground">Case Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">104</div>
                  <div className="text-sm text-muted-foreground">CA Courts</div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Link 
                  href="/judges"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Explore Judge Profiles
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