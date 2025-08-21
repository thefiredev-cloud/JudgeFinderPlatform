'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  onReset?: () => void
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorField?: string
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if error is form-related
    const isFormError = error.message.includes('validation') ||
                       error.message.includes('required') ||
                       error.message.includes('invalid')

    return {
      hasError: true,
      error,
      errorField: isFormError ? error.message : undefined
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form Error Boundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorField: undefined
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Form Error Occurred
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {this.state.errorField 
                    ? `Form validation error: ${this.state.errorField}`
                    : 'An error occurred while processing the form. Please check your input and try again.'
                  }
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={this.handleReset}
                  className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm hover:bg-red-200 transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Form
                </button>
              </div>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono overflow-auto max-h-32">
                <div className="text-red-800 font-semibold">
                  {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <pre className="mt-2 text-red-700 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Inline form error component for field-level errors
 */
interface FormErrorProps {
  error?: string | string[]
  field?: string
  className?: string
}

export function FormError({ error, field, className = '' }: FormErrorProps) {
  if (!error) return null

  const errors = Array.isArray(error) ? error : [error]

  return (
    <div className={`mt-1 ${className}`}>
      {errors.map((err, index) => (
        <div key={index} className="flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>
            {field && `${field}: `}{err}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Hook for managing form errors
 */
export function useFormErrors() {
  const [errors, setErrors] = React.useState<Record<string, string | string[]>>({})

  const setError = React.useCallback((field: string, error: string | string[]) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [])

  const clearError = React.useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = React.useCallback(() => {
    setErrors({})
  }, [])

  const hasErrors = Object.keys(errors).length > 0

  const getError = React.useCallback((field: string) => {
    return errors[field]
  }, [errors])

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
    getError
  }
}