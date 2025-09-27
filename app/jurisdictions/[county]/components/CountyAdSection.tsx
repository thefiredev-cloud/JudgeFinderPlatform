'use client'

import { LazyGoogleAd } from '@/components/ads/GoogleAd'

interface CountyAdSectionProps {
  title: string
  slot: string
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  className?: string
}

export function CountyAdSection({ title, slot, format = 'auto', className = '' }: CountyAdSectionProps) {
  return (
    <section className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
        <LazyGoogleAd
          slot={slot}
          format={format}
          responsive
          className="w-full"
          style={{ minHeight: format === 'horizontal' ? 90 : 250 }}
        />
      </div>
    </section>
  )
}

export default CountyAdSection


