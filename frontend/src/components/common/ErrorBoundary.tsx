import { Component, ErrorInfo, ReactNode } from "react";
import { secureLogger } from "@/utils/secureLogger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    secureLogger.error("Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV === "production" && window.sentryAPI) {
      window.sentryAPI.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mt-1">
                  We have encountered an unexpected error
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6">
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Error:
                      </p>
                      <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-x-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Component Stack:
                        </p>
                        <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Go to Home
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                If this problem persists, please{" "}
                <a
                  href="/settings"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

declare global {
  interface Window {
    sentryAPI?: {
      captureException: (error: Error, context?: Record<string, unknown>) => void;
    };
  }
}

export default ErrorBoundary;
