'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Search, Home } from 'lucide-react'
import Link from 'next/link'
import type { Judge } from '@/types'

interface JudgeErrorBoundaryProps {
  children: React.ReactNode
  judgeName?: string
  slug?: string
  suggestions?: Judge[]
}

interface JudgeErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class JudgeErrorBoundary extends React.Component<
  JudgeErrorBoundaryProps,
  JudgeErrorBoundaryState
> {
  constructor(props: JudgeErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): JudgeErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Judge profile error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-4">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Unable to Load Judge Profile
              </h1>

              <p className="text-gray-600 mb-6">
                {this.props.judgeName 
                  ? `We encountered an error while loading the profile for Judge ${this.props.judgeName}.`
                  : 'We encountered an error while loading this judge profile.'
                }
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </div>
              )}

              {this.props.suggestions && this.props.suggestions.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Similar Judges You Might Be Looking For:
                  </h3>
                  <div className="space-y-2">
                    {this.props.suggestions.slice(0, 3).map((judge) => (
                      <Link
                        key={judge.id}
                        href={`/judges/${judge.name
                          .toLowerCase()
                          .replace(/[^a-z0-9\s]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/(^-|-$)/g, '')}`}
                        className="block p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-blue-900">{judge.name}</div>
                        <div className="text-sm text-blue-700">{judge.court_name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>

                <Link
                  href="/judges"
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse All Judges
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useJudgeErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: any) => {
    console.error('Judge profile error:', error, errorInfo)
    
    // Could send to error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }, [])

  return { handleError }
}