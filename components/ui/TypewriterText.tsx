'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string
  delay?: number
}

export function TypewriterText({ text, delay = 50 }: TypewriterTextProps) {
  // Start with full text to prevent hydration mismatch
  const [displayText, setDisplayText] = useState(text)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    // Only animate after mount to avoid hydration issues
    if (!mounted) return
    
    // Reset and start typewriter animation
    setDisplayText('')
    
    if (!text) return
    
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        const char = text.charAt(index)
        setDisplayText(prev => prev + char)
        index++
      } else {
        clearInterval(timer)
      }
    }, delay)
    
    return () => {
      clearInterval(timer)
    }
  }, [text, delay, mounted])
  
  // Use suppressHydrationWarning since we know the text will change after mount
  return <span suppressHydrationWarning>{displayText}</span>
}