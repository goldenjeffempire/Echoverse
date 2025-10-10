import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Wifi } from 'lucide-react';
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
  reconnectCountdown: number;
  isReconnecting: boolean;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  private countdownInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reconnectCountdown: 10,
      isReconnecting: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[WebSocket Error Boundary]', error, errorInfo);
    this.setState({ errorInfo });
    
    // PHASE 3: Start automatic reconnection countdown
    this.startReconnectionCountdown();
  }

  // PHASE 3: Automatic reconnection with countdown
  startReconnectionCountdown = () => {
    let countdown = 10;
    this.setState({ reconnectCountdown: countdown });

    this.countdownInterval = setInterval(() => {
      countdown--;
      this.setState({ reconnectCountdown: countdown });

      if (countdown <= 0) {
        this.clearCountdown();
        this.handleAutoReconnect();
      }
    }, 1000);
  };

  clearCountdown = () => {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  };

  handleAutoReconnect = () => {
    this.setState({ isReconnecting: true });
    
    this.reconnectTimeout = setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  handleManualReset = () => {
    this.clearCountdown();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.setState({ hasError: false, error: null, errorInfo: null, isReconnecting: false });
    window.location.reload();
  };

  componentWillUnmount() {
    this.clearCountdown();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { reconnectCountdown, isReconnecting } = this.state;

      return (
        <div className="space-y-4 m-4">
          {/* PHASE 3: Connection quality indicator */}
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-semibold">Poor Connection</span>
            </div>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>WebSocket Connection Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Real-time communication features are temporarily unavailable.
                {this.state.error && (
                  <span className="block text-sm mt-1 opacity-80">
                    {this.state.error.message}
                  </span>
                )}
              </p>

              {/* PHASE 3: Automatic reconnection with countdown */}
              {!isReconnecting && (
                <div className="space-y-2">
                  <p className="text-sm">
                    Automatically reconnecting in {reconnectCountdown} seconds...
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={this.handleManualReset}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect Now
                    </Button>
                  </div>
                </div>
              )}

              {isReconnecting && (
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Reconnecting...</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
