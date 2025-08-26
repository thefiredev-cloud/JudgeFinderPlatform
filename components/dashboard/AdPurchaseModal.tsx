'use client'

import { useState } from 'react'
import { X, Check, Zap, Shield, TrendingUp, ChevronRight, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdPurchaseModalProps {
  onClose: () => void
  userId: string
}

type PricingPlan = 'federal_monthly' | 'federal_annual' | 'state_monthly' | 'state_annual'

export default function AdPurchaseModal({ onClose, userId }: AdPurchaseModalProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const federalMonthlyPrice = 500
  const stateMonthlyPrice = 200
  
  // Annual pricing with 2 months free (10 months price for 12 months)
  const federalAnnualPrice = federalMonthlyPrice * 10
  const stateAnnualPrice = stateMonthlyPrice * 10
  
  const federalAnnualSavings = federalMonthlyPrice * 2
  const stateAnnualSavings = stateMonthlyPrice * 2

  const handleProceedToSelection = () => {
    if (!selectedPlan) return
    
    // Navigate to ad spots explorer with pricing context
    const params = new URLSearchParams({
      plan: selectedPlan,
      preselected: 'true'
    })
    
    router.push(`/dashboard/advertiser/ad-spots?${params}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Advertise on Judge Profiles
            </h2>
            <p className="text-gray-600 mt-1">
              Reach attorneys and litigants researching judges in your jurisdiction
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual Billing
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  Save 2 Months
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Federal Judge Card */}
            <div 
              className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                (selectedPlan === 'federal_monthly' || selectedPlan === 'federal_annual')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(billingCycle === 'monthly' ? 'federal_monthly' : 'federal_annual')}
            >
              {/* Premium Badge */}
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  PREMIUM
                </span>
              </div>

              <div className="mt-2">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Federal Judge Profiles
                </h3>
                
                <div className="mt-4">
                  {billingCycle === 'monthly' ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">${federalMonthlyPrice}</span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">${federalAnnualPrice}</span>
                        <span className="text-gray-600 ml-2">/year</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm text-green-600 font-medium">
                          Save ${federalAnnualSavings} (2 months free!)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Premium placement on federal judge profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Higher visibility for complex federal cases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Reach attorneys handling federal litigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Advanced analytics and reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Priority customer support</span>
                  </li>
                </ul>

                {/* Selection Indicator */}
                {(selectedPlan === 'federal_monthly' || selectedPlan === 'federal_annual') && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* State Judge Card */}
            <div 
              className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                (selectedPlan === 'state_monthly' || selectedPlan === 'state_annual')
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(billingCycle === 'monthly' ? 'state_monthly' : 'state_annual')}
            >
              {/* Popular Badge */}
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  MOST POPULAR
                </span>
              </div>

              <div className="mt-2">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  State Judge Profiles
                </h3>
                
                <div className="mt-4">
                  {billingCycle === 'monthly' ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">${stateMonthlyPrice}</span>
                      <span className="text-gray-600 ml-2">/month</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">${stateAnnualPrice}</span>
                        <span className="text-gray-600 ml-2">/year</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm text-green-600 font-medium">
                          Save ${stateAnnualSavings} (2 months free!)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Prominent placement on state judge profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Target local attorneys and litigants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">High volume of state court searches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Detailed performance metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email support included</span>
                  </li>
                </ul>

                {/* Selection Indicator */}
                {(selectedPlan === 'state_monthly' || selectedPlan === 'state_annual') && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Why Advertise on JudgeFinder?
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Targeted Reach</h4>
                <p className="text-sm text-gray-600">
                  Connect with attorneys actively researching judges for their cases
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">High Intent Traffic</h4>
                <p className="text-sm text-gray-600">
                  Users are decision-makers looking for legal representation
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Measurable ROI</h4>
                <p className="text-sm text-gray-600">
                  Track impressions, clicks, and conversions with detailed analytics
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Limited Availability</p>
                <p>
                  Only 3 advertising slots available per judge profile. Federal judges typically have 
                  higher case values and complexity, while state judges see higher search volume.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToSelection}
              disabled={!selectedPlan}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Select Judges to Advertise On
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}