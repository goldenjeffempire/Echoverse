import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
class RouteErrorBoundaryClass extends Component {
    constructor(props) {
        super(props);
        this.handleReset = () => {
            this.setState({
                hasError: false,
                error: null
            });
        };
        this.state = {
            hasError: false,
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        // RouteErrorBoundary caught error
        if (process.env.NODE_ENV === 'production') {
            this.logErrorToService(error, errorInfo);
        }
    }
    logErrorToService(error, errorInfo) {
        // Error in route - would be sent to error reporting service
    }
    render() {
        if (this.state.hasError) {
            return (<div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card rounded-lg border shadow-sm p-8">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive"/>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">
              Page Error
            </h2>
            
            <p className="text-muted-foreground text-center mb-6">
              {this.props.routeName
                    ? `There was an error loading the ${this.props.routeName} page.`
                    : 'There was an error loading this page.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (<div className="mb-6 p-4 bg-muted rounded-lg overflow-auto max-h-32">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.toString()}
                </p>
              </div>)}
            
            <div className="flex gap-3">
              <Button onClick={this.handleReset} className="flex-1" variant="outline">
                <RefreshCcw className="w-4 h-4 mr-2"/>
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="flex-1">
                <Home className="w-4 h-4 mr-2"/>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
export function RouteErrorBoundary({ children, routeName }) {
    return (<RouteErrorBoundaryClass routeName={routeName}>
      {children}
    </RouteErrorBoundaryClass>);
}
