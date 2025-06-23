import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProgressiveLoading, useProgressiveData } from "./ProgressiveLoading";
import { EnhancedLoading } from "./EnhancedLoading";
import {
  DashboardSkeleton,
  ShoesListingSkeleton,
  ListingSkeleton,
  DetailPageSkeleton
} from "./PageSkeletons";

interface ProgressivePageProps<T> {
  query: {
    data: T | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch?: () => void;
  };
  layout?: "dashboard" | "shoes" | "list" | "detail";
  message?: string;
  children: (data: T, isStale: boolean) => React.ReactNode;
  className?: string;
  showStaleIndicator?: boolean;
}

export function ProgressivePage<T>({
  query,
  layout = "list",
  message = "Loading...",
  children,
  className = "",
  showStaleIndicator = true
}: ProgressivePageProps<T>) {
  const { displayData, isStale, hasData, isFirstLoad } = useProgressiveData(
    query.data,
    query.isLoading,
    query.error
  );

  // First load - show skeleton
  if (isFirstLoad) {
    return (
      <EnhancedLoading
        message={message}
        layout={layout}
        holdDelay={200}
        skeletonDelay={300}
        showProgress={true}
        error={query.error}
        onRetry={query.refetch}
      />
    );
  }

  // Has data (fresh or stale) - show with progressive loading
  if (hasData && displayData) {
    return (
      <ProgressiveLoading
        data={displayData}
        isLoading={query.isLoading}
        error={query.error}
        fallback={getSkeleton(layout)}
        onRetry={query.refetch}
        showStaleIndicator={showStaleIndicator}
        className={className}
      >
        {children}
      </ProgressiveLoading>
    );
  }

  // Fallback to enhanced loading
  return (
    <EnhancedLoading
      message={message}
      layout={layout}
      error={query.error}
      onRetry={query.refetch}
    />
  );
}

function getSkeleton(layout: string) {
  const skeletonProps = { animate: true };

  switch (layout) {
    case "dashboard":
      return <DashboardSkeleton {...skeletonProps} />;
    case "shoes":
      return <ShoesListingSkeleton {...skeletonProps} />;
    case "detail":
      return <DetailPageSkeleton {...skeletonProps} />;
    case "list":
    default:
      return <ListingSkeleton {...skeletonProps} />;
  }
}

// Higher-order component for easy wrapping
export function withProgressiveLoading<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  options: {
    layout?: "dashboard" | "shoes" | "list" | "detail";
    message?: string;
    getQuery: (props: T) => {
      data: any;
      isLoading: boolean;
      error: Error | null;
      refetch?: () => void;
    };
  }
) {
  return function ProgressiveComponent(props: T) {
    const query = options.getQuery(props);

    return (
      <ProgressivePage
        query={query}
        layout={options.layout}
        message={options.message}
      >
        {(data, isStale) => (
          <div className={isStale ? "opacity-90" : ""}>
            <Component {...props} data={data} />
          </div>
        )}
      </ProgressivePage>
    );
  };
}

// Utility hook for multiple queries
export function useProgressiveQueries(queries: Array<{
  data: any;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void;
}>) {
  const combinedData = queries.map(q => q.data);
  const isAnyLoading = queries.some(q => q.isLoading);
  const hasAnyError = queries.find(q => q.error);
  const hasAllData = queries.every(q => q.data);

  const refetchAll = () => {
    queries.forEach(q => q.refetch?.());
  };

  return {
    data: combinedData,
    isLoading: isAnyLoading,
    error: hasAnyError?.error || null,
    refetch: refetchAll,
    hasAllData,
    isFirstLoad: isAnyLoading && !hasAllData
  };
}

// Specialized components for common patterns
export function ProgressiveDashboard({
  statsQuery,
  collectionsQuery,
  shoesQuery,
  runsQuery,
  children
}: {
  statsQuery: any;
  collectionsQuery: any;
  shoesQuery: any;
  runsQuery: any;
  children: (data: {
    stats: any;
    collections: any;
    shoes: any;
    runs: any;
  }, isStale: boolean) => React.ReactNode;
}) {
  const combinedQuery = useProgressiveQueries([
    statsQuery,
    collectionsQuery,
    shoesQuery,
    runsQuery
  ]);

  return (
    <ProgressivePage
      query={{
        data: combinedQuery.hasAllData ? {
          stats: statsQuery.data,
          collections: collectionsQuery.data,
          shoes: shoesQuery.data,
          runs: runsQuery.data
        } : undefined,
        isLoading: combinedQuery.isLoading,
        error: combinedQuery.error,
        refetch: combinedQuery.refetch
      }}
      layout="dashboard"
      message="Loading your dashboard..."
    >
      {(data, isStale) => children(data, isStale)}
    </ProgressivePage>
  );
}

export function ProgressiveList<T>({
  query,
  emptyState,
  children,
  layout = "list",
  message = "Loading..."
}: {
  query: {
    data: T[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch?: () => void;
  };
  emptyState: React.ReactNode;
  children: (items: T[], isStale: boolean) => React.ReactNode;
  layout?: "list" | "shoes";
  message?: string;
}) {
  return (
    <ProgressivePage
      query={query}
      layout={layout}
      message={message}
    >
      {(data, isStale) => {
        if (!data || data.length === 0) {
          return <>{emptyState}</>;
        }
        return children(data, isStale);
      }}
    </ProgressivePage>
  );
}

// Loading state wrapper that preserves layout
export function LayoutPreservingLoader({
  isLoading,
  skeleton,
  children,
  className = ""
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return <div className={className}>{skeleton}</div>;
  }

  return <div className={className}>{children}</div>;
}

// Inline loading component for sections
export function InlineLoader({
  isLoading,
  size = "md",
  message
}: {
  isLoading: boolean;
  size?: "sm" | "md" | "lg";
  message?: string;
}) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center space-x-2">
        <div className={`border-2 border-blue-600 border-t-transparent rounded-full animate-spin ${sizeClasses[size]}`} />
        {message && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
