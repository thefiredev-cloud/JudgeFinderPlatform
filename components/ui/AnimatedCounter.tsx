'use client'

import { useState, useEffect } from 'react'

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
}

export function AnimatedCounter({ end, duration = 2000, suffix = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration])
  
  return <span>{count.toLocaleString()}{suffix}</span>
}