'use client'

import { useState } from 'react'
import { User, Star, MessageSquare, DollarSign } from 'lucide-react'

interface AttorneySlotsProps {
  judgeId: string
  judgeName: string
}

export function AttorneySlots({ judgeId, judgeName }: AttorneySlotsProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  // Mock data for attorney slots
  const slots = [
    {
      id: 1,
      attorney: 'Michael Chen, Esq.',
      firm: 'Chen & Associates',
      specialty: 'Criminal Defense',
      rating: 4.8,
      cases_before_judge: 23,
      success_rate: 0.78,
      testimonial: 'Extensive experience with Judge ' + judgeName + ' in criminal matters.'
    },
    {
      id: 2,
      attorney: 'Sarah Martinez, Esq.',
      firm: 'Martinez Law Group',
      specialty: 'Civil Litigation',
      rating: 4.9,
      cases_before_judge: 45,
      success_rate: 0.82,
      testimonial: 'Successfully argued numerous civil cases before this judge.'
    },
    {
      id: 3,
      attorney: null,
      available: true,
      price: '$299/month'
    },
    {
      id: 4,
      attorney: null,
      available: true,
      price: '$299/month'
    }
  ]

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Featured Attorneys</h2>
        <p className="text-sm text-gray-600">
          Attorneys with experience before {judgeName}
        </p>
      </div>

      <div className="space-y-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className={`rounded-lg border p-4 transition-all ${
              slot.available
                ? 'border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            {slot.attorney ? (
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{slot.attorney}</h3>
                    <p className="text-sm text-gray-600">{slot.firm}</p>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{slot.rating}</span>
                  </div>
                </div>

                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
                    {slot.specialty}
                  </span>
                  <span className="rounded bg-green-100 px-2 py-1 text-green-700">
                    {slot.cases_before_judge} cases
                  </span>
                  <span className="rounded bg-purple-100 px-2 py-1 text-purple-700">
                    {(slot.success_rate * 100).toFixed(0)}% success
                  </span>
                </div>

                <p className="mb-3 text-sm italic text-gray-600">
                  "{slot.testimonial}"
                </p>

                <button className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Contact Attorney
                </button>
              </div>
            ) : (
              <div className="text-center">
                <User className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="mb-1 font-medium text-gray-700">Available Slot</p>
                <p className="mb-3 text-sm text-gray-500">
                  Advertise your practice here
                </p>
                <p className="mb-3 text-lg font-bold text-gray-900">{slot.price}</p>
                <button
                  onClick={() => setSelectedSlot(slot.id)}
                  className="w-full rounded border border-blue-600 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Claim This Slot
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <p className="ml-2 text-sm text-blue-900">
            <strong>For Attorneys:</strong> Showcase your expertise to potential clients
            researching {judgeName}.
          </p>
        </div>
      </div>
    </div>
  )
}