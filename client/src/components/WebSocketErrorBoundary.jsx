import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export class WebSocketErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.countdownInterval = null;
        this.reconnectTimeout = null;
        // PHASE 3: Automatic reconnection with countdown
        this.startReconnectionCountdown = () => {
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
        this.clearCountdown = () => {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        };
        this.handleAutoReconnect = () => {
            this.setState({ isReconnecting: true });
            this.reconnectTimeout = setTimeout(() => {
                window.location.reload();
            }, 1000);
        };
        this.handleManualReset = () => {
            this.clearCountdown();
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            this.setState({ hasError: false, error: null, errorInfo: null, isReconnecting: false });
            window.location.reload();
        };
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            reconnectCountdown: 10,
            isReconnecting: false
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[WebSocket Error Boundary]', error, errorInfo);
        this.setState({ errorInfo });
        // PHASE 3: Start automatic reconnection countdown
        this.startReconnectionCountdown();
    }
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
            return (<div className="space-y-4 m-4">
          {/* PHASE 3: Connection quality indicator */}
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4"/>
              <span className="text-sm font-semibold">Poor Connection</span>
            </div>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4"/>
            <AlertTitle>WebSocket Connection Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                Real-time communication features are temporarily unavailable.
                {this.state.error && (<span className="block text-sm mt-1 opacity-80">
                    {this.state.error.message}
                  </span>)}
              </p>

              {/* PHASE 3: Automatic reconnection with countdown */}
              {!isReconnecting && (<div className="space-y-2">
                  <p className="text-sm">
                    Automatically reconnecting in {reconnectCountdown} seconds...
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={this.handleManualReset}>
                      <RefreshCw className="h-4 w-4 mr-2"/>
                      Reconnect Now
                    </Button>
                  </div>
                </div>)}

              {isReconnecting && (<div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin"/>
                  <span>Reconnecting...</span>
                </div>)}
            </AlertDescription>
          </Alert>
        </div>);
        }
        return this.props.children;
    }
}
