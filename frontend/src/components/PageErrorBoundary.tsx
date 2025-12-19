import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AccessibleButton } from './ui/AccessibleButton';
import { errorReporting } from '../services/errorReporting';
import { secureLogger } from '../utils/secureLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * PageLevelErrorBoundary
 * 
 * A specialized error boundary for individual pages or route segments.
 * Prevents the entire application from crashing when a specific page fails.
 */
class PageLevelErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    secureLogger.error('Page error caught:', error, errorInfo);
    
    // Log to our centralized error reporting service
    errorReporting.reportReactError(error, { componentStack: errorInfo.componentStack || '' }, 'PageLevelErrorBoundary');
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            This content couldn't be loaded
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
            We encountered an unexpected error while trying to display this page. 
            Detailed technical information has been logged for our team.
          </p>
          
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <div className="w-full max-w-2xl bg-slate-100 dark:bg-slate-950 p-4 rounded text-left overflow-auto font-mono text-xs text-red-600 mb-6 border border-red-200">
              {this.state.error.toString()}
            </div>
          )}
          
          <div className="flex gap-4">
            <AccessibleButton 
              onClick={this.handleGoHome}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Home size={16} />
              Go to Dashboard
            </AccessibleButton>
            
            <AccessibleButton 
              onClick={this.handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Try Again
            </AccessibleButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageLevelErrorBoundary;
