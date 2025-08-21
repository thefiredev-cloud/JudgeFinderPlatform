'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, ArrowLeft, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
  title?: string
  description?: string
}

interface State {
  hasError: boolean
  error: Error | null
  isNetworkError: boolean
  retryCount: number
}

export class ApiErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isNetworkError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isNetworkError = error.message.includes('fetch') || 
                          error.message.includes('network') ||
                          error.message.includes('Failed to load')

    return {
      hasError: true,
      error,
      isNetworkError
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('API Error Boundary caught an error:', error, errorInfo)
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logApiError(error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private logApiError(error: Error, errorInfo: React.ErrorInfo) {
    const errorData = {
      type: 'api_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine,
      retryCount: this.state.retryCount
    }

    // Send to logging service (replace with actual service)
    console.error('🌐 API Error:', errorData)
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      isNetworkError: false,
      retryCount: prevState.retryCount + 1
    }))

    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry()
    }

    // Auto-retry after a delay for network errors
    if (this.state.isNetworkError && this.state.retryCount < 3) {
      this.retryTimeoutId = setTimeout(() => {
        this.setState({ hasError: false, error: null })
      }, 2000)
    }
  }

  private handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { isNetworkError, retryCount } = this.state
      const canAutoRetry = isNetworkError && retryCount < 3
      
      return (
        <div className="min-h-[400px] flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6 text-center">
            <div className="flex justify-center mb-4">
              {isNetworkError ? (
                <div className="bg-orange-100 rounded-full p-3">
                  <WifiOff className="h-8 w-8 text-orange-600" />
                </div>
              ) : (
                <div className="bg-red-100 rounded-full p-3">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {this.props.title || (isNetworkError ? 'Connection Problem' : 'Data Loading Error')}
            </h3>

            <p className="text-gray-600 mb-6">
              {this.props.description || (
                isNetworkError 
                  ? 'Unable to connect to the server. Please check your internet connection and try again.'
                  : 'We encountered an error while loading the data. Please try again.'
              )}
            </p>

            {canAutoRetry && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  Automatically retrying... (Attempt {retryCount + 1}/3)
                </p>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-2000"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                disabled={canAutoRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${canAutoRetry ? 'animate-spin' : ''}`} />
                {canAutoRetry ? 'Retrying...' : 'Try Again'}
              </button>

              <button
                onClick={this.handleGoBack}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>

              <Link
                href="/"
                className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Return Home
              </Link>
            </div>

            {isNetworkError && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  {navigator.onLine ? (
                    <>
                      <Wifi className="h-4 w-4 mr-2 text-green-500" />
                      Connected to Internet
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 mr-2 text-red-500" />
                      No Internet Connection
                    </>
                  )}
                </div>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                  <div className="text-red-600 font-semibold">
                    {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for handling API errors in functional components
 */
export function useApiErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleError = React.useCallback((error: Error) => {
    console.error('API Error:', error)
    setError(error)
  }, [])

  const retry = React.useCallback(async (retryFn: () => Promise<void>) => {
    setIsRetrying(true)
    setError(null)
    
    try {
      await retryFn()
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsRetrying(false)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isRetrying,
    handleError,
    retry,
    clearError
  }
}