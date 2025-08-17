'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface County {
  id: string
  name: string
  judges_count: number
  status: 'active' | 'expanding' | 'planned'
  phase: number
}

const counties: County[] = [
  {
    id: 'orange',
    name: 'Orange County',
    judges_count: 250,
    status: 'active',
    phase: 2
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles County',
    judges_count: 600,
    status: 'expanding',
    phase: 3
  },
  {
    id: 'san-diego',
    name: 'San Diego County',
    judges_count: 150,
    status: 'planned',
    phase: 4
  },
  {
    id: 'santa-clara',
    name: 'Santa Clara County',
    judges_count: 75,
    status: 'planned',
    phase: 4
  }
]

export function CountySelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCounty, setSelectedCounty] = useState<County>(counties[0])
  const router = useRouter()

  const handleCountyChange = (county: County) => {
    setSelectedCounty(county)
    setIsOpen(false)
    
    // Navigate to county-specific page
    if (county.status === 'active' || county.status === 'expanding') {
      router.push(`/counties/${county.id}`)
    }
  }

  const getStatusBadge = (status: County['status']) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      expanding: 'bg-blue-100 text-blue-800 border-blue-200',
      planned: 'bg-gray-100 text-gray-600 border-gray-200'
    }
    
    const labels = {
      active: 'Active',
      expanding: 'Expanding',
      planned: 'Planned'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <MapPinIcon className="h-5 w-5 text-gray-400" />
        <span className="font-medium text-gray-900">{selectedCounty.name}</span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-sm font-medium text-gray-700 px-3 py-2 border-b border-gray-100">
              Select County Market
            </div>
            {counties.map((county) => (
              <button
                key={county.id}
                onClick={() => handleCountyChange(county)}
                className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-md transition-colors"
                disabled={county.status === 'planned'}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{county.name}</span>
                  {getStatusBadge(county.status)}
                </div>
                <div className="text-sm text-gray-600">
                  {county.judges_count} judges • Phase {county.phase}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {county.status === 'active' ? 'Data available' : 
                   county.status === 'expanding' ? 'Expanding coverage' : 
                   'Coming soon'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CountySelector