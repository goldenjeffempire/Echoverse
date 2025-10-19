import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.handleReset = () => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null
            });
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        // ErrorBoundary caught an error
        this.setState({
            error,
            errorInfo
        });
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        // Log to error reporting service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate with error reporting service (Sentry, Rollbar, etc.)
            this.logErrorToService(error, errorInfo);
        }
    }
    logErrorToService(error, errorInfo) {
        // Send to backend error reporting endpoint
        fetch('/api/errors/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: error.toString(),
                errorInfo: errorInfo.componentStack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.error('Failed to report error:', err));
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600"/>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              We're sorry for the inconvenience. The error has been logged and we'll look into it.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (<div className="mb-6 p-4 bg-gray-100 rounded-lg overflow-auto max-h-48">
                <p className="text-sm font-mono text-red-600 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (<pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>)}
              </div>)}
            
            <div className="flex gap-3">
              <Button onClick={this.handleReset} className="flex-1" variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} className="flex-1">
                Go Home
              </Button>
            </div>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
