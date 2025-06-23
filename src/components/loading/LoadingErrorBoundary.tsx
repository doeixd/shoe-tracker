import React from "react";
import { motion } from "motion/react";
import { AlertCircle, RefreshCw, Home, WifiOff } from "lucide-react";

interface LoadingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface LoadingErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  showErrorDetails?: boolean;
}

export class LoadingErrorBoundary extends React.Component<
  LoadingErrorBoundaryProps,
  LoadingErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: LoadingErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<LoadingErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error("LoadingErrorBoundary caught an error:", error, errorInfo);

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Auto-retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    this.retryTimeoutId = setTimeout(() => {
      // Force re-render
      this.forceUpdate();
    }, delay);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  getErrorType(error: Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
      return "network";
    }

    if (message.includes("not authenticated") || message.includes("unauthorized")) {
      return "auth";
    }

    if (message.includes("chunk") || message.includes("loading chunk")) {
      return "chunk";
    }

    return "generic";
  }

  renderErrorContent() {
    const { error, retryCount } = this.state;
    const { maxRetries = 3, showErrorDetails = false } = this.props;

    if (!error) return null;

    const errorType = this.getErrorType(error);
    const canRetry = retryCount < maxRetries;

    const errorConfig = {
      network: {
        title: "Connection Problem",
        description: "Unable to connect to the server. Please check your internet connection.",
        icon: <WifiOff className="w-8 h-8 text-orange-500" />,
        color: "orange",
        suggestion: "Check your internet connection and try again.",
      },
      auth: {
        title: "Authentication Required",
        description: "You need to sign in to access this content.",
        icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
        color: "amber",
        suggestion: "Please sign in to continue.",
      },
      chunk: {
        title: "Loading Error",
        description: "Failed to load application resources. This might be due to a new version being deployed.",
        icon: <RefreshCw className="w-8 h-8 text-blue-500" />,
        color: "blue",
        suggestion: "Refresh the page to load the latest version.",
      },
      generic: {
        title: "Something went wrong",
        description: "An unexpected error occurred while loading the content.",
        icon: <AlertCircle className="w-8 h-8 text-red-500" />,
        color: "red",
        suggestion: "Try refreshing the page or contact support if the problem persists.",
      },
    };

    const config = errorConfig[errorType];

    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-${config.color}-50 border border-${config.color}-200 flex items-center justify-center`}>
            {config.icon}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {config.title}
          </h2>

          <p className="text-gray-600 mb-4">
            {config.description}
          </p>

          <p className="text-sm text-gray-500 mb-6">
            {config.suggestion}
          </p>

          {retryCount > 0 && (
            <p className="text-xs text-gray-400 mb-4">
              Retry attempt: {retryCount}/{maxRetries}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && errorType !== "auth" && (
              <motion.button
                onClick={this.handleRetry}
                className={`inline-flex items-center px-6 py-3 bg-${config.color}-600 text-white font-medium rounded-lg hover:bg-${config.color}-700 focus:outline-none focus:ring-2 focus:ring-${config.color}-500 focus:ring-offset-2 transition-colors`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {errorType === "chunk" ? "Refresh Page" : "Try Again"}
              </motion.button>
            )}

            {errorType === "auth" && (
              <motion.button
                onClick={() => window.location.href = "/auth/signin"}
                className="inline-flex items-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign In
              </motion.button>
            )}

            <motion.button
              onClick={() => window.location.href = "/"}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </motion.button>
          </div>

          {showErrorDetails && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                Technical Details
              </summary>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono text-gray-700">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </motion.div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Use default error UI
      return this.renderErrorContent();
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
}

// Higher-order component for easy wrapping
export function withLoadingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<LoadingErrorBoundaryProps, "children">
) {
  return function WrappedComponent(props: P) {
    return (
      <LoadingErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </LoadingErrorBoundary>
    );
  };
}

// Specialized error boundary for route loading
export function RouteLoadingErrorBoundary({
  children,
  routeName
}: {
  children: React.ReactNode;
  routeName?: string;
}) {
  return (
    <LoadingErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`Route loading error in ${routeName || "unknown route"}:`, error, errorInfo);
      }}
      maxRetries={2}
      showErrorDetails={process.env.NODE_ENV === "development"}
    >
      {children}
    </LoadingErrorBoundary>
  );
}
