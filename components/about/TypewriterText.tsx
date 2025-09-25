'use client'

import { useEffect, useState } from 'react'

export interface TypewriterTextProps {
  text: string
  delay?: number
}

export function TypewriterText({ text, delay = 50 }: TypewriterTextProps): JSX.Element {
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
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
  }, [text, delay])

  return <span>{displayText}</span>
}

export default TypewriterText


