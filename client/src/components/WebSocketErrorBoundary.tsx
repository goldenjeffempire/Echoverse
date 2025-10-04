import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WebSocket Error Boundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>WebSocket Connection Error</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Real-time communication features are temporarily unavailable.
              {this.state.error && (
                <span className="block text-sm mt-1 opacity-80">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
