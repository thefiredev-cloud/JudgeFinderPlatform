'use client'

import { useState } from 'react'
import { Search, MapPin, Building, Filter } from 'lucide-react'

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="mx-auto max-w-4xl">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by judge name, court, or case type..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-4 text-gray-300 hover:bg-gray-700"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button className="rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700">
            Search
          </button>
        </div>

        {/* Quick Filters */}
        {showFilters && (
          <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Jurisdiction
                </label>
                <select className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                  <option>All Jurisdictions</option>
                  <option>Federal</option>
                  <option>California</option>
                  <option>New York</option>
                  <option>Texas</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  <Building className="inline h-4 w-4 mr-1" />
                  Court Type
                </label>
                <select className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                  <option>All Courts</option>
                  <option>Supreme Court</option>
                  <option>Appeals Court</option>
                  <option>District Court</option>
                  <option>Superior Court</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Case Specialization
                </label>
                <select className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                  <option>All Types</option>
                  <option>Civil Litigation</option>
                  <option>Criminal</option>
                  <option>Family Law</option>
                  <option>Corporate</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">Popular searches:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {['Judge Sarah Johnson', 'California Superior Court', 'Patent Cases', 'Criminal Defense'].map(
            (term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:border-blue-500 hover:text-blue-400"
              >
                {term}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}