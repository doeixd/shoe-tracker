import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";

interface ProgressiveLoadingProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error?: Error | null;
  fallback?: React.ReactNode;
  children: (data: T, isStale: boolean) => React.ReactNode;
  onRetry?: () => void;
  showStaleIndicator?: boolean;
  className?: string;
}

export function ProgressiveLoading<T>({
  data,
  isLoading,
  error,
  fallback,
  children,
  onRetry,
  showStaleIndicator = true,
  className = ""
}: ProgressiveLoadingProps<T>) {
  const [cachedData, setCachedData] = useState<T | undefined>(data);
  const [showStaleToast, setShowStaleToast] = useState(false);

  // Update cached data when fresh data arrives
  useEffect(() => {
    if (data && !error) {
      setCachedData(data);
      if (showStaleToast) {
        setShowStaleToast(false);
      }
    }
  }, [data, error, showStaleToast]);

  // Show stale indicator when loading with cached data
  useEffect(() => {
    if (isLoading && cachedData && showStaleIndicator) {
      setShowStaleToast(true);
    }
  }, [isLoading, cachedData, showStaleIndicator]);

  const displayData = cachedData || data;
  const isStale = isLoading && !!cachedData;

  // Error state without cached data
  if (error && !cachedData) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
        <ErrorDisplay error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Loading state without cached data
  if (isLoading && !cachedData) {
    return (
      <div className={className}>
        {fallback}
      </div>
    );
  }

  // Show data (fresh or stale)
  if (displayData) {
    return (
      <div className={`relative ${className}`}>
        {children(displayData, isStale)}

        {/* Stale data indicator */}
        <AnimatePresence>
          {showStaleToast && (
            <StaleDataIndicator
              onDismiss={() => setShowStaleToast(false)}
              error={error}
              onRetry={onRetry}
            />
          )}
        </AnimatePresence>

        {/* Background refresh indicator */}
        {isStale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 z-10"
          >
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Updating...
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // No data and no loading
  return (
    <div className={className}>
      {fallback}
    </div>
  );
}

function StaleDataIndicator({
  onDismiss,
  error,
  onRetry
}: {
  onDismiss: () => void;
  error?: Error | null;
  onRetry?: () => void;
}) {
  const isNetworkError = error?.message?.includes("network") ||
                         error?.message?.includes("fetch") ||
                         error?.message?.includes("offline");

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm"
    >
      <div className={`rounded-lg shadow-lg p-4 border ${
        error
          ? isNetworkError
            ? "bg-orange-50 border-orange-200 text-orange-800"
            : "bg-red-50 border-red-200 text-red-800"
          : "bg-blue-50 border-blue-200 text-blue-800"
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {error ? (
              isNetworkError ? (
                <WifiOff className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )
            ) : (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {error
                ? isNetworkError
                  ? "Connection problem"
                  : "Update failed"
                : "Refreshing data..."
              }
            </p>
            {error && (
              <p className="text-xs mt-1 opacity-80">
                Showing last known data
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {error && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs font-medium hover:underline focus:outline-none"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs font-medium hover:underline focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ErrorDisplay({
  error,
  onRetry
}: {
  error: Error;
  onRetry?: () => void;
}) {
  const isNetworkError = error?.message?.includes("network") ||
                         error?.message?.includes("fetch") ||
                         error?.message?.includes("offline");

  const isAuthError = error?.message?.includes("not authenticated") ||
                      error?.message?.includes("Unauthorized") ||
                      error?.message?.includes("access denied");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-6 max-w-md mx-auto"
    >
      <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
        isAuthError
          ? "bg-amber-100 text-amber-600"
          : isNetworkError
            ? "bg-orange-100 text-orange-600"
            : "bg-red-100 text-red-600"
      }`}>
        {isNetworkError ? (
          <WifiOff className="w-6 h-6" />
        ) : (
          <AlertCircle className="w-6 h-6" />
        )}
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isAuthError
          ? "Authentication Required"
          : isNetworkError
            ? "Connection Problem"
            : "Something went wrong"
        }
      </h3>

      <p className="text-gray-600 mb-4 text-sm">
        {isAuthError
          ? "Please sign in to access this content."
          : isNetworkError
            ? "Check your internet connection and try again."
            : error.message || "An unexpected error occurred."
        }
      </p>

      {onRetry && !isAuthError && (
        <motion.button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </motion.button>
      )}

      {isAuthError && (
        <motion.button
          onClick={() => window.location.href = "/auth/signin"}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Sign In
        </motion.button>
      )}
    </motion.div>
  );
}

// Hook for progressive loading pattern
export function useProgressiveData<T>(
  data: T | undefined,
  isLoading: boolean,
  error?: Error | null
) {
  const [cachedData, setCachedData] = useState<T | undefined>(data);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (data && !error) {
      setCachedData(data);
      setIsStale(false);
    } else if (isLoading && cachedData) {
      setIsStale(true);
    }
  }, [data, isLoading, error, cachedData]);

  return {
    displayData: cachedData || data,
    isStale: isStale && isLoading,
    hasData: !!(cachedData || data),
    isFirstLoad: isLoading && !cachedData
  };
}

// Component wrapper for easy progressive loading
export function WithProgressiveLoading<T extends Record<string, any>>({
  query,
  fallback,
  children,
  onRetry,
  className = ""
}: {
  query: {
    data: T | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch?: () => void;
  };
  fallback: React.ReactNode;
  children: (data: T, isStale: boolean) => React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  const handleRetry = onRetry || query.refetch;

  return (
    <ProgressiveLoading
      data={query.data}
      isLoading={query.isLoading}
      error={query.error}
      fallback={fallback}
      onRetry={handleRetry}
      className={className}
    >
      {children}
    </ProgressiveLoading>
  );
}
