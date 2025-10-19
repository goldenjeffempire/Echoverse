/**
 * Enhanced Error Boundary with Recovery
 * FIX #17: HIGH-022 - Add automatic retry and circuit breaker
 */
import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
export class ErrorBoundaryEnhanced extends Component {
    constructor(props) {
        super(props);
        this.retryTimeout = null;
        this.scheduleRetry = () => {
            const delay = RETRY_DELAY * Math.pow(2, this.state.retryCount);
            this.retryTimeout = setTimeout(() => {
                this.setState(state => ({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                    retryCount: state.retryCount + 1
                }));
            }, delay);
        };
        this.handleManualRetry = () => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: 0
            });
        };
        this.handleReload = () => {
            window.location.reload();
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            errorInfo
        });
        // Call custom error handler
        this.props.onError?.(error, errorInfo);
        // Auto-retry for transient errors
        if (this.isTransientError(error) && this.state.retryCount < MAX_RETRIES) {
            this.scheduleRetry();
        }
    }
    componentWillUnmount() {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
        }
    }
    isTransientError(error) {
        const transientPatterns = [
            /network/i,
            /timeout/i,
            /fetch/i,
            /loading chunk/i,
            /failed to fetch/i
        ];
        return transientPatterns.some(pattern => pattern.test(error.message) || pattern.test(error.name));
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (<div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6"/>
              <h2 className="text-lg font-semibold">Something went wrong</h2>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {this.state.retryCount > 0 && this.state.retryCount < MAX_RETRIES && (<p className="text-sm text-muted-foreground">
                Retry attempt {this.state.retryCount} of {MAX_RETRIES}...
              </p>)}

            <div className="flex gap-2">
              <Button onClick={this.handleManualRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2"/>
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="flex-1">
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (<details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>)}
          </div>
        </div>);
        }
        return this.props.children;
    }
}
