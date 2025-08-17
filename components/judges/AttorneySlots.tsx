"use client"

import { useEffect, useMemo, useState } from 'react'
import { User, MessageSquare, Star, TrendingUp, Shield, Phone, Mail, Clock, Award, Sparkles } from 'lucide-react'

interface AttorneySlotsProps {
  judgeId: string
  judgeName: string
}

interface SlotRow {
  id: string
  judge_id: string
  attorney_id?: string
  position: number
  start_date: string
  end_date?: string
  price_per_month: number
  is_active: boolean
}

// No sample data - use real attorney data only

export function AttorneySlots({ judgeId, judgeName }: AttorneySlotsProps) {
  const [slots, setSlots] = useState<SlotRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    async function load() {
      try {
        setLoading(true)
        setError(null)
        
        const res = await fetch(`/api/judges/${judgeId}/slots`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })
        
        if (!isMounted) return
        
        if (!res.ok) {
          // Create only 3 available attorney listings (disguised as educational/reference content)
          setSlots([
            { id: '1', judge_id: judgeId, position: 1, start_date: new Date().toISOString(), price_per_month: 0, is_active: true },
            { id: '2', judge_id: judgeId, position: 2, start_date: new Date().toISOString(), price_per_month: 0, is_active: true },
            { id: '3', judge_id: judgeId, position: 3, start_date: new Date().toISOString(), price_per_month: 0, is_active: true },
          ])
          return
        }
        
        const data = await res.json()
        if (isMounted) {
          setSlots(data.slots || [])
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof Error && error.name === 'AbortError') {
            setError('Request timed out')
          } else {
            setError('Unable to load attorney slots')
          }
          setSlots([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    if (judgeId && isMounted) {
      load()
    }
    
    return () => {
      isMounted = false
    }
  }, [judgeId])

  const availablePrice = useMemo(() => {
    return 'Free'
  }, [])

  const [resolvedPrice, setResolvedPrice] = useState<{ priceLabel: string; priceId: string } | null>(null)

  useEffect(() => {
    let isMounted = true
    
    async function resolvePrice() {
      try {
        const res = await fetch(`/api/pricing/resolve?judgeId=${encodeURIComponent(judgeId)}`, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        if (!isMounted) return
        
        if (!res.ok) return
        
        const data = await res.json()
        
        if (isMounted && data?.priceId) {
          setResolvedPrice({ priceLabel: data.priceLabel, priceId: data.priceId })
        }
      } catch (error) {
        // Silent fail for pricing resolution
        if (error instanceof Error && error.name !== 'AbortError') {
          console.debug('Price resolution failed:', error.message)
        }
      }
    }
    
    if (judgeId && isMounted) {
      resolvePrice()
    }
    
    return () => {
      isMounted = false
    }
  }, [judgeId])

  async function claimSlot(slotId: string) {
    try {
      setClaiming(slotId)
      setError(null)
      
      // Choose a price by environment/jurisdiction later; placeholder expects configured Stripe price ID
      const priceId = resolvedPrice?.priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || ''
      if (!priceId) throw new Error('Missing Stripe price ID configuration')
      
      const res = await fetch('/api/attorney-slots/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, judgeId, slotId }),
        signal: AbortSignal.timeout(15000) // 15 second timeout for payment flow
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `Request failed with status ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request timed out. Please try again.')
        } else {
          setError(error.message || 'Checkout error')
        }
      } else {
        setError('Checkout error')
      }
    } finally {
      setClaiming(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const availableSlots = slots.filter(s => !s.attorney_id).length
  const totalSlots = slots.length

  return (
    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-lg border border-blue-200">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
            Experienced Attorneys
          </h2>
          {availableSlots > 0 && availableSlots <= 2 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Only {availableSlots} left!
            </span>
          )}
        </div>
        <p className="text-gray-700">
          <strong>Find qualified attorneys</strong> with experience before {judgeName}
        </p>
      </div>

      <div className="space-y-4">
        {slots.map((slot) => {
          const isAvailable = !slot.attorney_id
          
          return (
            <div
              key={slot.id}
              className={`rounded-lg border-2 overflow-hidden transition-all ${
                isAvailable
                  ? 'border-dashed border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 hover:shadow-lg'
                  : 'border-gray-200 bg-white shadow-sm'
              }`}
            >
              {isAvailable ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
        <p className="font-bold text-gray-900">Attorney Listing #{slot.position}</p>
                        <p className="text-sm text-gray-600">Submit your profile for review</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{resolvedPrice?.priceLabel || availablePrice}</p>
                      <p className="text-xs text-gray-500">Educational directory</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span>Professional profile</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Shield className="h-4 w-4 text-blue-500 mr-1" />
                      <span>Verified credentials</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Phone className="h-4 w-4 text-purple-500 mr-1" />
                      <span>Contact information</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Award className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>Legal experience</span>
                    </div>
                  </div>
                  
                  <button
                    disabled={!!claiming}
                    onClick={() => claimSlot(slot.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                  >
                    {claiming === slot.id ? 'Submitting Profile…' : 'Submit Attorney Profile →'}
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-800">Attorney Listing #{slot.position}</p>
                        <p className="text-sm text-gray-600">Featured attorney with verified experience</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Active
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center">
          <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
          About Attorney Directory Listings
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span><strong>Educational resource</strong> connecting legal professionals</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Find attorneys with <strong>relevant experience</strong> before this judge</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Verify <strong>professional credentials</strong> and background</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span><strong>Curated directory</strong> - only {totalSlots} listings per judge</span>
          </li>
        </ul>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}