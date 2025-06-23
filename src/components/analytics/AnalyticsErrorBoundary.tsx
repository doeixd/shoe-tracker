import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../ui/ui";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Analytics Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-danger-200 bg-danger-50/50">
          <CardHeader>
            <CardTitle className="text-danger-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Analytics Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-danger-700">
              Something went wrong while loading your analytics. This might be due to:
            </p>
            <ul className="text-sm text-danger-600 space-y-1 ml-4">
              <li>• Temporary data loading issue</li>
              <li>• Network connectivity problem</li>
              <li>• Corrupted chart data</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Reload Page
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-danger-600 cursor-pointer">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs bg-danger-100 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Loading States
export const AnalyticsLoading = ({
  message = "Loading analytics...",
  compact = false
}: {
  message?: string;
  compact?: boolean;
}) => {
  if (compact) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-600">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
      <CardContent className="p-8 sm:p-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
            <p className="text-sm text-gray-600">
              We're crunching your running data to provide meaningful insights.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Chart Loading Skeleton
export const ChartSkeleton = ({ height = 280 }: { height?: number }) => (
  <div
    className="bg-gray-100 rounded-lg animate-pulse relative overflow-hidden"
    style={{ height }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-20 bg-gray-200 rounded w-12" />
          <div className="h-32 bg-gray-200 rounded w-12" />
          <div className="h-24 bg-gray-200 rounded w-12" />
          <div className="h-40 bg-gray-200 rounded w-12" />
          <div className="h-16 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  </div>
);

// Empty States
export const AnalyticsEmpty = ({
  title = "No Data Available",
  description = "Start logging runs to see your analytics",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) => (
  <Card className="border-dashed border-2 border-gray-300">
    <CardContent className="p-8 sm:p-12">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 max-w-md mx-auto">{description}</p>
        </div>
        {action && <div className="pt-4">{action}</div>}
      </div>
    </CardContent>
  </Card>
);

// Metric Loading Card
export const MetricCardSkeleton = () => (
  <Card className="bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-300 rounded w-24" />
          <div className="h-8 bg-gray-300 rounded w-16" />
          <div className="h-3 bg-gray-300 rounded w-20" />
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded" />
      </div>
    </CardContent>
  </Card>
);

// Chart Error State
export const ChartError = ({
  onRetry,
  error = "Failed to load chart data"
}: {
  onRetry?: () => void;
  error?: string;
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <AlertTriangle className="w-12 h-12 text-warning-500" />
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-900">Chart Unavailable</h4>
      <p className="text-sm text-gray-600">{error}</p>
    </div>
    {onRetry && (
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </Button>
    )}
  </div>
);

// Shimmer animation keyframes are defined in mobile-optimizations.css
