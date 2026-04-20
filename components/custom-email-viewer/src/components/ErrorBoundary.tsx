import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { type ParseError } from '../types'

interface ErrorBoundaryProps {
  children: ReactNode
  textColor: string
  padding: number
  onError?: (error: ParseError) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred'
    }
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    console.warn('[EmailViewer] Render error:', error.message)

    if (this.props.onError) {
      this.props.onError({
        message: error.message,
        source: 'render',
        timestamp: new Date().toISOString()
      })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: `${this.props.padding * 2}px`,
            color: this.props.textColor,
            textAlign: 'center'
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '8px' }}>
            Unable to display email
          </p>
          <p style={{ fontSize: '0.9em', opacity: 0.7 }}>
            {this.state.errorMessage}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
