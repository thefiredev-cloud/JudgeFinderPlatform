'use client'

import React from 'react'
import { JudgeErrorBoundary } from './JudgeErrorBoundary'
import type { Judge } from '@/types'

interface JudgeClientWrapperProps {
  children: React.ReactNode
  judgeName?: string
  slug?: string
  suggestions?: Judge[]
}

export function JudgeClientWrapper({ 
  children, 
  judgeName, 
  slug, 
  suggestions 
}: JudgeClientWrapperProps) {
  return (
    <JudgeErrorBoundary 
      judgeName={judgeName} 
      slug={slug} 
      suggestions={suggestions}
    >
      {children}
    </JudgeErrorBoundary>
  )
}