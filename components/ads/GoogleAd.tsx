"use client"

import { useEffect, useRef, useState } from 'react'

interface GoogleAdProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  responsive?: boolean
  style?: React.CSSProperties
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function GoogleAd({ 
  slot, 
  format = 'auto', 
  responsive = true, 
  style = {},
  className = ''
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const isLoaded = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only push to adsbygoogle once per component instance
    if (!isLoaded.current && window.adsbygoogle && adRef.current) {
      try {
        window.adsbygoogle.push({})
        isLoaded.current = true
      } catch (error) {
        console.error('AdSense error:', error)
      }
    }
  }, [])

  // Don't render ads in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_ADS) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}
        style={style}
      >
        <div className="text-gray-500 text-sm">
          <div className="font-medium">Advertisement Placeholder</div>
          <div className="text-xs mt-1">Slot: {slot}</div>
          <div className="text-xs">Format: {format}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

// Lazy-loaded ad component for better performance
export function LazyGoogleAd(props: GoogleAdProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref}>
      {isVisible ? <GoogleAd {...props} /> : (
        <div 
          className={`bg-gray-50 rounded-lg ${props.className || ''}`} 
          style={{ minHeight: '250px', ...props.style }}
        />
      )}
    </div>
  )
}