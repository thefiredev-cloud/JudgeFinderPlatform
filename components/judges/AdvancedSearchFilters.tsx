'use client'

import { useState, useEffect } from 'react'
import { Filter, X, ChevronDown, Search, Scale, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'

interface FilterOptions {
  case_types: string[]
  experience_ranges: string[]
  case_value_ranges: string[]
  efficiency_levels: string[]
  specializations: string[]
}

interface AdvancedFilters {
  case_types: string[]
  min_experience: number
  max_experience: number
  case_value_range: string
  efficiency_level: string
  settlement_rate_min: number
  settlement_rate_max: number
  specialization: string
  court_types: string[]
}

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: AdvancedFilters) => void
  onClearFilters: () => void
  isOpen: boolean
  onToggle: () => void
}

const DEFAULT_FILTERS: AdvancedFilters = {
  case_types: [],
  min_experience: 0,
  max_experience: 50,
  case_value_range: '',
  efficiency_level: '',
  settlement_rate_min: 0,
  settlement_rate_max: 100,
  specialization: '',
  court_types: []
}

export function AdvancedSearchFilters({ onFiltersChange, onClearFilters, isOpen, onToggle }: AdvancedSearchFiltersProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    case_types: [
      'Civil Rights',
      'Contract Dispute',
      'Criminal',
      'Family Law',
      'Personal Injury',
      'Employment Law',
      'Business Litigation',
      'Real Estate',
      'Intellectual Property',
      'Immigration',
      'Bankruptcy',
      'Tax Law'
    ],
    experience_ranges: [
      '0-5 years',
      '5-10 years',
      '10-15 years',
      '15-20 years',
      '20+ years'
    ],
    case_value_ranges: [
      'Under $50k',
      '$50k - $250k',
      '$250k - $1M',
      '$1M - $5M',
      '$5M+'
    ],
    efficiency_levels: [
      'High (15+ cases/month)',
      'Average (5-15 cases/month)',
      'Low (Under 5 cases/month)'
    ],
    specializations: [
      'Commercial Litigation',
      'Family Court',
      'Criminal Court',
      'Civil Rights',
      'Personal Injury',
      'Business Law',
      'Real Estate Law',
      'Employment Law',
      'Immigration Court'
    ]
  })

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = <K extends keyof AdvancedFilters>(
    key: K,
    value: AdvancedFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: 'case_types' | 'court_types', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS)
    onClearFilters()
  }

  const hasActiveFilters = () => {
    return (
      filters.case_types.length > 0 ||
      filters.min_experience > 0 ||
      filters.max_experience < 50 ||
      filters.case_value_range !== '' ||
      filters.efficiency_level !== '' ||
      filters.settlement_rate_min > 0 ||
      filters.settlement_rate_max < 100 ||
      filters.specialization !== '' ||
      filters.court_types.length > 0
    )
  }

  if (!isOpen) {
    return (
      <div className="mb-6">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            hasActiveFilters()
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {hasActiveFilters() && (
            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {Object.values(filters).flat().filter(v => v && v !== 0 && v !== 100 && v !== 50 && v !== '').length}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Advanced Search Filters</h3>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Case Types */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Case Types
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filterOptions.case_types.map(caseType => (
              <label key={caseType} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.case_types.includes(caseType)}
                  onChange={() => toggleArrayFilter('case_types', caseType)}
                  className="rounded border-gray-600 bg-gray-800 text-blue-600"
                />
                <span className="text-gray-300">{caseType}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Years of Experience
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Minimum: {filters.min_experience} years</label>
              <input
                type="range"
                min="0"
                max="40"
                value={filters.min_experience}
                onChange={(e) => updateFilter('min_experience', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">
                Maximum: {filters.max_experience === 50 ? '50+' : filters.max_experience} years
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={filters.max_experience}
                onChange={(e) => updateFilter('max_experience', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Case Value Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Typical Case Value
          </label>
          <select
            value={filters.case_value_range}
            onChange={(e) => updateFilter('case_value_range', e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
          >
            <option value="">Any Value</option>
            {filterOptions.case_value_ranges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        {/* Settlement Rate Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Settlement Rate
          </label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400">Minimum: {filters.settlement_rate_min}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.settlement_rate_min}
                onChange={(e) => updateFilter('settlement_rate_min', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Maximum: {filters.settlement_rate_max}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.settlement_rate_max}
                onChange={(e) => updateFilter('settlement_rate_max', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Efficiency Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Case Load Efficiency
          </label>
          <select
            value={filters.efficiency_level}
            onChange={(e) => updateFilter('efficiency_level', e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
          >
            <option value="">Any Level</option>
            {filterOptions.efficiency_levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Specialization */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Specialization
          </label>
          <select
            value={filters.specialization}
            onChange={(e) => updateFilter('specialization', e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-300"
          >
            <option value="">Any Specialization</option>
            {filterOptions.specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Active Filters:</h4>
          <div className="flex flex-wrap gap-2">
            {filters.case_types.map(caseType => (
              <span key={caseType} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                {caseType}
                <button onClick={() => toggleArrayFilter('case_types', caseType)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.min_experience > 0 && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                Min exp: {filters.min_experience}y
              </span>
            )}
            {filters.max_experience < 50 && (
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                Max exp: {filters.max_experience}y
              </span>
            )}
            {filters.case_value_range && (
              <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                Value: {filters.case_value_range}
              </span>
            )}
            {filters.efficiency_level && (
              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                {filters.efficiency_level.split(' ')[0]} efficiency
              </span>
            )}
            {filters.specialization && (
              <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">
                {filters.specialization}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}