import React, { useState } from 'react'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ScaleIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface CountyData {
  id: string
  name: string
  phase: number
  status: 'active' | 'expanding' | 'planned'
  judges: number
  courts: number
  established_revenue: number | null
  revenue_potential: [number, number]
  top_practice_areas: string[]
  avg_attorney_budget: number
  success_rate: string
  expansion_factor: number
}

const countyData: CountyData[] = [
  {
    id: 'orange',
    name: 'Orange County',
    phase: 2,
    status: 'active',
    judges: 34,
    courts: 7,
    established_revenue: 32000,
    revenue_potential: [32000, 42500],
    top_practice_areas: ['Personal Injury', 'Family Law', 'Real Estate', 'Business Litigation'],
    avg_attorney_budget: 1000,
    success_rate: '100% (5/5 firms)',
    expansion_factor: 1.0
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles County',
    phase: 3,
    status: 'expanding',
    judges: 34,
    courts: 3,
    established_revenue: null,
    revenue_potential: [10075, 17050],
    top_practice_areas: ['Entertainment Law', 'Corporate Litigation', 'IP Law', 'Personal Injury'],
    avg_attorney_budget: 1500,
    success_rate: 'TBD (Phase 3)',
    expansion_factor: 0.31484375
  }
]

export function CountyComparison() {
  const [selectedCounties, setSelectedCounties] = useState<string[]>(['orange', 'los-angeles'])

  const toggleCounty = (countyId: string) => {
    setSelectedCounties(prev => 
      prev.includes(countyId) 
        ? prev.filter(id => id !== countyId)
        : [...prev, countyId]
    )
  }

  const selectedData = countyData.filter(county => selectedCounties.includes(county.id))

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">County Market Comparison</h3>
        <p className="text-gray-600">Compare market opportunities across California counties</p>
      </div>

      {/* County Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {countyData.map(county => (
            <button
              key={county.id}
              onClick={() => toggleCounty(county.id)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCounties.includes(county.id)
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {county.name}
              <span className="ml-2 text-xs">Phase {county.phase}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Grid */}
      {selectedData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                {selectedData.map(county => (
                  <th key={county.id} className="text-center py-3 px-4 font-semibold text-gray-900">
                    {county.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">Phase Status</td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      county.status === 'active' ? 'bg-green-100 text-green-800' :
                      county.status === 'expanding' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      Phase {county.phase} - {county.status}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">
                  <div className="flex items-center">
                    <ScaleIcon className="h-4 w-4 mr-2" />
                    Active Judges
                  </div>
                </td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center font-semibold">
                    {county.judges}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    Court Locations
                  </div>
                </td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center font-semibold">
                    {county.courts}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Established Revenue
                  </div>
                </td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center">
                    {county.established_revenue ? (
                      <span className="font-semibold text-green-600">
                        ${county.established_revenue.toLocaleString()}/mo
                      </span>
                    ) : (
                      <span className="text-gray-500">Expanding</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">
                  <div className="flex items-center">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                    Revenue Potential
                  </div>
                </td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center">
                    <span className="font-semibold text-blue-600">
                      ${county.revenue_potential[0].toLocaleString()}-${county.revenue_potential[1].toLocaleString()}/mo
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">Average Attorney Budget</td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center font-semibold">
                    ${county.avg_attorney_budget}/mo
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">Success Rate</td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center font-medium">
                    {county.success_rate}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-gray-700">Top Practice Areas</td>
                {selectedData.map(county => (
                  <td key={county.id} className="py-3 px-4 text-center">
                    <div className="text-sm">
                      {county.top_practice_areas.slice(0, 2).map((area, idx) => (
                        <div key={idx} className="text-gray-600">{area}</div>
                      ))}
                      {county.top_practice_areas.length > 2 && (
                        <div className="text-gray-400 text-xs">
                          +{county.top_practice_areas.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center mb-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-semibold text-blue-900">Expansion Analysis</span>
        </div>
        <p className="text-blue-800 text-sm">
          Los Angeles County represents a {(selectedData.find(c => c.id === 'los-angeles')?.expansion_factor || 0).toFixed(1)}x revenue expansion opportunity 
          with premium entertainment and corporate law markets driving higher attorney budgets.
        </p>
      </div>
    </div>
  )
}

export default CountyComparison