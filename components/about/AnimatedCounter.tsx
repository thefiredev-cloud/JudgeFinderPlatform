'use client'

import { useEffect, useState } from 'react'

export interface AnimatedCounterProps {
  end: number
  duration?: number
}

export function AnimatedCounter({ end, duration = 2000 }: AnimatedCounterProps): JSX.Element {
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

  return <span>{count.toLocaleString()}</span>
}

export default AnimatedCounter


