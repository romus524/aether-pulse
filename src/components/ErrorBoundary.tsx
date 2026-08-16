import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060913] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900/90 border border-red-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold text-white font-sora">
              Clinical Telemetry Interface Recovered
            </h2>
            <p className="text-xs text-slate-400 font-sora">
              A temporary display exception occurred. The system has stabilized session telemetry.
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-sora text-xs font-bold flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resume Active Monitoring</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
