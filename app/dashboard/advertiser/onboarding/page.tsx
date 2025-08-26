'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building, User, Shield, ArrowRight, Check, TrendingUp } from 'lucide-react'

export default function AdvertiserOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    firm_name: '',
    firm_type: 'small' as 'solo' | 'small' | 'medium' | 'large' | 'enterprise',
    contact_email: '',
    contact_phone: '',
    bar_number: '',
    bar_state: 'CA',
    website: '',
    description: '',
    specializations: [] as string[],
    billing_email: '',
    billing_address: ''
  })

  const firmTypes = [
    { value: 'solo', label: 'Solo Practice', description: '1 attorney' },
    { value: 'small', label: 'Small Firm', description: '2-10 attorneys' },
    { value: 'medium', label: 'Medium Firm', description: '11-50 attorneys' },
    { value: 'large', label: 'Large Firm', description: '51-200 attorneys' },
    { value: 'enterprise', label: 'Enterprise', description: '200+ attorneys' }
  ]

  const specializations = [
    'Personal Injury', 'Criminal Defense', 'Family Law', 'Business Law',
    'Real Estate', 'Estate Planning', 'Immigration', 'Bankruptcy',
    'Employment Law', 'Intellectual Property', 'Tax Law', 'Civil Litigation'
  ]

  async function handleSubmit() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/advertising/advertiser/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create advertiser profile')
      }

      // Success - redirect to dashboard
      router.push('/dashboard/advertiser')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to JudgeFinder Advertising
          </h1>
          <p className="text-xl text-gray-600">
            Reach thousands of potential clients searching for legal representation
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                `}>
                  {step > i ? <Check className="h-5 w-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-24 h-1 ml-4 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Building className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Firm Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name *
                </label>
                <input
                  type="text"
                  value={formData.firm_name}
                  onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mitchell & Associates LLP"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {firmTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, firm_type: type.value as any })}
                      className={`
                        p-3 rounded-lg border-2 text-left transition-colors
                        ${formData.firm_type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@lawfirm.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(714) 555-0100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.lawfirm.com"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.firm_name || !formData.contact_email}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Professional Verification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bar Number *
                  </label>
                  <input
                    type="text"
                    value={formData.bar_number}
                    onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bar State *
                  </label>
                  <select
                    value={formData.bar_state}
                    onChange={(e) => setFormData({ ...formData, bar_state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Practice Areas
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializations.map((spec) => (
                    <label key={spec} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              specializations: [...formData.specializations, spec]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              specializations: formData.specializations.filter(s => s !== spec)
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell potential clients about your firm's experience and expertise..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.bar_number}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Billing Information</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="billing@lawfirm.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Address
                </label>
                <textarea
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St, Suite 100
Orange County, CA 92701"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Targeted Exposure</h3>
            <p className="text-sm text-gray-600">
              Reach clients actively researching judges and courts in your area
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Verified Credibility</h3>
            <p className="text-sm text-gray-600">
              Build trust with bar-verified professional profiles
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Premium Placement</h3>
            <p className="text-sm text-gray-600">
              Get prime visibility on high-traffic judge and court profiles
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}