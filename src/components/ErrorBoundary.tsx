import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <div className="glass-panel p-8 rounded-2xl max-w-lg w-full border border-red-500/20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-6">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-red-500 mb-2">Something went wrong</h1>
                <p className="text-glass-secondary mb-6">
                    The application encountered an unexpected error.
                </p>
                <div className="bg-black/10 dark:bg-black/30 p-4 rounded-lg text-left text-xs font-mono text-glass-secondary mb-6 overflow-auto max-h-40">
                    {this.state.error?.message || "Unknown error"}
                </div>
                <button
                    onClick={() => {
                        this.setState({ hasError: false, error: null });
                        this.props.onReset();
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Reset Application
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
