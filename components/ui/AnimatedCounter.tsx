'use client'

import { useState, useEffect } from 'react'

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
}

export function AnimatedCounter({ end, duration = 2000, suffix = '' }: AnimatedCounterProps) {
  // Start with the final value to prevent hydration mismatch
  const [count, setCount] = useState(end)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    // Only animate after mount to avoid hydration issues
    if (!mounted) return
    
    // Reset to 0 and start animation
    setCount(0)
    
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, mounted])
  
  // Use suppressHydrationWarning since we know the value will change after mount
  return <span suppressHydrationWarning>{count.toLocaleString()}{suffix}</span>
}