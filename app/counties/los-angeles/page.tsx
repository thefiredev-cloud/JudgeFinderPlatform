import React from 'react'
import { Metadata } from 'next'
import { CountySelector } from '@/components/ui/CountySelector'
import { 
  FilmIcon, 
  BuildingOfficeIcon, 
  ScaleIcon, 
  GlobeAmericasIcon,
  HomeIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import fs from 'fs'
import path from 'path'

// Load LA County market intelligence data
const laMarketIntel = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'la-county-data', 'la-county-market-intelligence.json'),
    'utf8'
  )
)

export const metadata: Metadata = {
  title: 'Los Angeles County Judges | JudgeFinder | Entertainment & Corporate Law Intelligence',
  description: 'Access comprehensive judicial intelligence for LA County Superior Court judges. Specialized analytics for entertainment law, corporate litigation, and high-value legal practices in Los Angeles.',
  keywords: 'Los Angeles County judges, Hollywood entertainment law, corporate litigation, LA Superior Court, judicial analytics, California courts'
}

const practiceAreas = [
  {
    name: 'Entertainment Law',
    icon: FilmIcon,
    description: 'Hollywood entertainment industry legal services',
    budget: '$2,000-4,000/month',
    highlight: 'Premium',
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  {
    name: 'Corporate Litigation',
    icon: BuildingOfficeIcon,
    description: 'Major corporation business litigation',
    budget: '$1,500-3,000/month',
    highlight: 'High-Value',
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    name: 'Personal Injury',
    icon: ScaleIcon,
    description: 'Auto accidents, medical malpractice, premises liability',
    budget: '$800-1,500/month',
    highlight: 'High-Volume',
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    name: 'Immigration Law',
    icon: GlobeAmericasIcon,
    description: 'Immigration and naturalization services',
    budget: '$600-1,200/month',
    highlight: 'Growing',
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  {
    name: 'Real Estate Law',
    icon: HomeIcon,
    description: 'Property transactions, development, disputes',
    budget: '$800-1,800/month',
    highlight: 'Premium Market',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  },
  {
    name: 'Intellectual Property',
    icon: LightBulbIcon,
    description: 'Tech/entertainment IP protection and litigation',
    budget: '$1,200-2,500/month',
    highlight: 'Specialized',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }
]

const marketStats = {
  judges: 34,
  courts: 3,
  slots_available: 170,
  revenue_potential: {
    conservative: 10075,
    aggressive: 17050
  },
  expansion_phase: 3
}

export default function LACountyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with County Selector */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Los Angeles County</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Phase 3 Expansion
              </span>
            </div>
            <CountySelector />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Hollywood Legal Intelligence Hub
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Access premium judicial analytics for Los Angeles County Superior Court. 
              Specialized insights for entertainment law, corporate litigation, and high-value legal practices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{marketStats.judges}</div>
                <div className="text-purple-100">Active Judges</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{marketStats.courts}</div>
                <div className="text-purple-100">Court Locations</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{marketStats.slots_available}</div>
                <div className="text-purple-100">Attorney Slots</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">${marketStats.revenue_potential.conservative.toLocaleString()}+</div>
                <div className="text-purple-100">Monthly Potential</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Areas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Premium Legal Practice Areas
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Los Angeles County offers unique opportunities for high-value legal specializations, 
            from Hollywood entertainment to Fortune 500 corporate litigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {practiceAreas.map((area) => (
            <div key={area.name} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg ${area.color}`}>
                  <area.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">{area.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${area.color}`}>
                    {area.highlight}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{area.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Attorney Budget:</span>
                <span className="text-sm font-bold text-green-600">{area.budget}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Projections */}
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                LA County Revenue Opportunity
              </h3>
              <p className="text-xl text-gray-600">
                Premium entertainment and corporate markets drive higher attorney advertising budgets
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <FilmIcon className="h-8 w-8 text-purple-600 mr-2" />
                  <span className="text-lg font-semibold">Tier 1 Premium</span>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  ${laMarketIntel.revenue_projections.tier_1_total.conservative_monthly.toLocaleString()}+
                </div>
                <div className="text-gray-600">Entertainment & Corporate</div>
                <div className="text-sm text-gray-500">10 firms • $2,000-4,000/month</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <ScaleIcon className="h-8 w-8 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold">Tier 2 Volume</span>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ${laMarketIntel.revenue_projections.tier_2_total.conservative_monthly.toLocaleString()}+
                </div>
                <div className="text-gray-600">PI & Immigration</div>
                <div className="text-sm text-gray-500">10 firms • $600-1,500/month</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-600 mr-2" />
                  <span className="text-lg font-semibold">Tier 3 Growth</span>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${laMarketIntel.revenue_projections.tier_3_total.conservative_monthly.toLocaleString()}+
                </div>
                <div className="text-gray-600">Emerging Practices</div>
                <div className="text-sm text-gray-500">15 firms • $400-1,000/month</div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="text-center">
                <CurrencyDollarIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  Total LA County Potential
                </h4>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  ${(laMarketIntel.revenue_projections.tier_1_total.conservative_monthly + laMarketIntel.revenue_projections.tier_2_total.conservative_monthly + laMarketIntel.revenue_projections.tier_3_total.conservative_monthly).toLocaleString()}-${(laMarketIntel.revenue_projections.tier_1_total.aggressive_monthly + laMarketIntel.revenue_projections.tier_2_total.aggressive_monthly + laMarketIntel.revenue_projections.tier_3_total.aggressive_monthly).toLocaleString()}/month
                </div>
                <p className="text-gray-600">
                  35 target law firms across entertainment, corporate, and specialized practice areas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Dominate LA County Legal Market?
          </h3>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join leading entertainment and corporate law firms leveraging judicial intelligence 
            for competitive advantage in Los Angeles County.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              View Judge Profiles
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}