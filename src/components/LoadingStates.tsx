import React from "react";
import {
  Loader2,
  Plus,
  Search,
  AlertCircle,
  Wifi,
  RefreshCw,
} from "lucide-react";

// Basic loading spinner
export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Loader2
      className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
}

// Full page loading screen
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Section loading placeholder
export function SectionLoading({
  message = "Loading...",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow border p-6 animate-pulse"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </>
  );
}

// Table loading skeleton
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        {icon || <Search className="w-8 h-8 text-gray-400" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
            action.variant === "secondary"
              ? "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </button>
      )}
    </div>
  );
}

// Error state component
interface ErrorStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: "error" | "warning" | "network";
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  type = "error",
  className = "",
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case "network":
        return <Wifi className="w-8 h-8 text-orange-500" />;
      case "warning":
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      default:
        return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "network":
        return "bg-orange-50 border-orange-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-red-50 border-red-200";
    }
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${getBgColor()}`}
      >
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {action.label}
        </button>
      )}
    </div>
  );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <ErrorState
      type="network"
      title="Connection Problem"
      description="Unable to connect to the server. Please check your internet connection and try again."
      action={{
        label: "Try Again",
        onClick: onRetry,
      }}
    />
  );
}

// No data placeholder for lists
export function NoDataPlaceholder({
  type,
  onCreateNew,
}: {
  type: "shoes" | "collections" | "runs";
  onCreateNew: () => void;
}) {
  const config = {
    shoes: {
      title: "No shoes yet",
      description:
        "Add your first pair of running shoes to start tracking your mileage and performance.",
      actionLabel: "Add Your First Shoe",
    },
    collections: {
      title: "No collections yet",
      description:
        "Create collections to organize your shoes by type, brand, or purpose.",
      actionLabel: "Create Your First Collection",
    },
    runs: {
      title: "No runs logged yet",
      description:
        "Start logging your runs to track your progress and shoe usage over time.",
      actionLabel: "Log Your First Run",
    },
  };

  return (
    <EmptyState
      title={config[type].title}
      description={config[type].description}
      action={{
        label: config[type].actionLabel,
        onClick: onCreateNew,
      }}
    />
  );
}

// Search no results
export function NoSearchResults({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8 text-gray-400" />}
      title="No results found"
      description={`No items match your search for "${query}". Try adjusting your search terms or filters.`}
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
        variant: "secondary",
      }}
    />
  );
}

// Section loading with skeleton
export function SectionLoadingSkeleton({
  lines = 3,
  showTitle = true,
  className = "",
}: {
  lines?: number;
  showTitle?: boolean;
  className?: string;
}) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {showTitle && (
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inline loading with better UX
export function InlineLoading({
  message = "Loading...",
  size = "sm",
  showMessage = true,
  className = "",
}: {
  message?: string;
  size?: "xs" | "sm" | "md";
  showMessage?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <div className={`flex items-center justify-center py-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <div
          className={`border-2 border-blue-500 border-t-transparent rounded-full animate-spin ${sizeClasses[size]}`}
        />
        {showMessage && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

// Smart loading that adapts based on data state
export function SmartLoader({
  isLoading,
  hasData,
  error,
  skeleton,
  children,
  emptyState,
  errorState,
  className = "",
}: {
  isLoading: boolean;
  hasData: boolean;
  error?: Error | null;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  className?: string;
}) {
  if (error && errorState) {
    return <div className={className}>{errorState}</div>;
  }

  if (isLoading && !hasData) {
    return <div className={className}>{skeleton}</div>;
  }

  if (!hasData && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Loading overlay for existing content
export function LoadingOverlay({
  isLoading,
  children,
  message = "Loading...",
  className = "",
}: {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading button state
export function LoadingButton({
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
