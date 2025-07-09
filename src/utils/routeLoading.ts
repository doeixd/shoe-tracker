import { QueryClient } from "@tanstack/react-query";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import { useEffect } from "react";
import React from "react";

// Standard loading delays for consistency
export const LOADING_DELAYS = {
  HOLD: 200,
  SKELETON: 300,
  SPINNER: 1200,
  MIN_SHOW: 300,
} as const;

// Route loading configuration
export interface RouteLoadingConfig {
  message?: string;
  layout?: "dashboard" | "shoes" | "list" | "detail" | "navigation";
  holdDelay?: number;
  skeletonDelay?: number;
  showProgress?: boolean;
}

// Default loading configurations for different route types
export const DEFAULT_LOADING_CONFIGS: Record<string, RouteLoadingConfig> = {
  dashboard: {
    message: "Loading your dashboard...",
    layout: "dashboard",
    holdDelay: LOADING_DELAYS.HOLD,
    skeletonDelay: LOADING_DELAYS.SKELETON,
    showProgress: true,
  },
  collections: {
    message: "Loading collections...",
    layout: "list",
    holdDelay: LOADING_DELAYS.HOLD,
    skeletonDelay: LOADING_DELAYS.SKELETON,
    showProgress: true,
  },
  collectionDetail: {
    message: "Loading collection...",
    layout: "detail",
    holdDelay: LOADING_DELAYS.HOLD,
    skeletonDelay: LOADING_DELAYS.SKELETON,
    showProgress: true,
  },
  shoes: {
    message: "Loading your shoes...",
    layout: "shoes",
    holdDelay: LOADING_DELAYS.HOLD,
    skeletonDelay: LOADING_DELAYS.SKELETON,
    showProgress: true,
  },
  runs: {
    message: "Loading your runs...",
    layout: "list",
    holdDelay: LOADING_DELAYS.HOLD,
    skeletonDelay: LOADING_DELAYS.SKELETON,
    showProgress: true,
  },
  form: {
    message: "Loading...",
    layout: "detail",
    holdDelay: 100,
    skeletonDelay: 200,
    showProgress: false,
  },
} as const;

// Create standardized pending component
export function createPendingComponent(
  configKey: keyof typeof DEFAULT_LOADING_CONFIGS,
  overrides?: Partial<RouteLoadingConfig>,
): React.ComponentType {
  const config = { ...DEFAULT_LOADING_CONFIGS[configKey], ...overrides };

  return function PendingComponent() {
    return React.createElement(EnhancedLoading, {
      message: config.message,
      layout: config.layout,
      holdDelay: config.holdDelay,
      skeletonDelay: config.skeletonDelay,
      showProgress: config.showProgress,
    });
  };
}

// Generic loader function with proper error handling
export interface LoaderConfig {
  queryClient: QueryClient;
  queries: Array<{
    queryKey: any;
    queryFn: any;
    critical?: boolean; // Whether to wait for this query
  }>;
  prefetchQueries?: Array<{
    queryKey: any;
    queryFn: any;
  }>;
}

export async function createOptimizedLoader(config: LoaderConfig) {
  const { queryClient, queries, prefetchQueries = [] } = config;

  try {
    // Check if user is authenticated before preloading
    const authQuery = queryClient.getQueryData([
      "convex",
      "auth.getUserProfile",
      {},
    ]);

    // Only execute queries if we have auth data
    if (!authQuery) {
      console.debug("No auth data available - skipping preload");
      return {};
    }

    // Separate critical and non-critical queries
    const criticalQueries = queries.filter((q) => q.critical !== false);
    const backgroundQueries = queries.filter((q) => q.critical === false);

    // Execute critical queries and wait for them
    const criticalPromises = criticalQueries.map((query) =>
      queryClient.ensureQueryData({
        queryKey: query.queryKey,
        queryFn: query.queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes default stale time
      }),
    );

    await Promise.all(criticalPromises);

    // Execute background queries without waiting
    backgroundQueries.forEach((query) => {
      queryClient
        .prefetchQuery({
          queryKey: query.queryKey,
          queryFn: query.queryFn,
          staleTime: 5 * 60 * 1000,
        })
        .catch(() => {
          // Silently fail for background queries
        });
    });

    // Execute prefetch queries in background
    prefetchQueries.forEach((query) => {
      queryClient
        .prefetchQuery({
          queryKey: query.queryKey,
          queryFn: query.queryFn,
          staleTime: 5 * 60 * 1000,
        })
        .catch(() => {
          // Silently fail for prefetch queries
        });
    });

    return {};
  } catch (error: any) {
    // Handle auth errors gracefully
    if (error?.message?.includes("not authenticated")) {
      console.debug("Auth error during preload (expected):", error);
      return {};
    }

    // Re-throw other errors
    throw error;
  }
}

// Utility for creating query configurations with consistent retry logic
export function createQueryConfig(
  baseQuery: any,
  options?: {
    staleTime?: number;
    enabled?: boolean;
  },
) {
  return {
    ...baseQuery,
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes default
    enabled: options?.enabled ?? true,
  };
}

// Error boundary wrapper for route components
export function createRouteErrorComponent(
  routeName: string,
  customHandlers?: {
    notFound?: () => React.ReactElement;
    unauthorized?: () => React.ReactElement;
    generic?: (error: any) => React.ReactElement;
  },
): React.ComponentType<{ error: any }> {
  return function RouteErrorComponent({ error }: { error: any }) {
    // Handle specific error types
    if (
      error.message?.includes("not found") ||
      error.message?.includes("Not found")
    ) {
      if (customHandlers?.notFound) {
        return customHandlers.notFound();
      }

      return React.createElement(
        "div",
        {
          className:
            "min-h-screen flex items-center justify-center bg-gray-50 px-4",
        },
        React.createElement(
          "div",
          { className: "max-w-md w-full space-y-8 text-center" },
          React.createElement(
            "div",
            { className: "space-y-6" },
            React.createElement(
              "div",
              {
                className:
                  "w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto",
              },
              React.createElement(
                "svg",
                {
                  className: "w-8 h-8 text-blue-600",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                },
                React.createElement("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z",
                }),
              ),
            ),
            React.createElement(
              "div",
              { className: "space-y-2" },
              React.createElement(
                "h2",
                { className: "text-2xl font-bold text-gray-900" },
                `${routeName} Not Found`,
              ),
              React.createElement(
                "p",
                { className: "text-gray-600" },
                `The ${routeName.toLowerCase()} you're looking for doesn't exist or has been removed.`,
              ),
            ),
          ),
        ),
      );
    }

    if (error.message?.includes("not authenticated")) {
      if (customHandlers?.unauthorized) {
        return customHandlers.unauthorized();
      }

      return React.createElement(
        "div",
        {
          className:
            "min-h-screen flex items-center justify-center bg-gray-50 px-4",
        },
        React.createElement(
          "div",
          { className: "max-w-md w-full space-y-8 text-center" },
          React.createElement(
            "div",
            { className: "space-y-6" },
            React.createElement(
              "div",
              {
                className:
                  "w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto",
              },
              React.createElement(
                "svg",
                {
                  className: "w-8 h-8 text-amber-600",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24",
                },
                React.createElement("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: 2,
                  d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                }),
              ),
            ),
            React.createElement(
              "div",
              { className: "space-y-2" },
              React.createElement(
                "h2",
                { className: "text-2xl font-bold text-gray-900" },
                "Authentication Required",
              ),
              React.createElement(
                "p",
                { className: "text-gray-600" },
                "Please sign in to access this content.",
              ),
            ),
          ),
        ),
      );
    }

    // Generic error handler
    if (customHandlers?.generic) {
      return customHandlers.generic(error);
    }

    return React.createElement(
      "div",
      {
        className:
          "min-h-screen flex items-center justify-center bg-gray-50 px-4",
      },
      React.createElement(
        "div",
        { className: "max-w-md w-full space-y-8 text-center" },
        React.createElement(
          "div",
          { className: "space-y-6" },
          React.createElement(
            "div",
            {
              className:
                "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto",
            },
            React.createElement(
              "svg",
              {
                className: "w-8 h-8 text-red-600",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
              },
              React.createElement("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z",
              }),
            ),
          ),
          React.createElement(
            "div",
            { className: "space-y-2" },
            React.createElement(
              "h2",
              { className: "text-2xl font-bold text-gray-900" },
              "Something went wrong",
            ),
            React.createElement(
              "p",
              { className: "text-gray-600" },
              error.message || "An unexpected error occurred",
            ),
          ),
        ),
      ),
    );
  };
}

// Performance monitoring utilities
export const RoutePerformance = {
  start: (routeName: string) => {
    if (typeof window !== "undefined" && window.performance) {
      window.performance.mark(`route-${routeName}-start`);
    }
  },

  end: (routeName: string) => {
    if (typeof window !== "undefined" && window.performance) {
      window.performance.mark(`route-${routeName}-end`);
      try {
        window.performance.measure(
          `route-${routeName}-duration`,
          `route-${routeName}-start`,
          `route-${routeName}-end`,
        );
      } catch (e) {
        // Ignore measurement errors
      }
    }
  },

  measure: (routeName: string) => {
    if (typeof window !== "undefined" && window.performance) {
      try {
        const measures = window.performance.getEntriesByName(
          `route-${routeName}-duration`,
        );
        return measures.length > 0 ? measures[0].duration : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  },
};

// Hook for route loading states
export function useRouteLoading(isLoading: boolean, routeName: string): void {
  useEffect(() => {
    if (isLoading) {
      RoutePerformance.start(routeName);
    } else {
      RoutePerformance.end(routeName);
    }
  }, [isLoading, routeName]);
}

// Utility functions for route optimization
export const RouteOptimization = {
  // Check if a route should use optimized loading
  shouldUseOptimizedLoading: (routeName: string, userAgent?: string) => {
    // Always use optimized loading for mobile devices
    if (userAgent?.includes("Mobile")) {
      return true;
    }

    // Use optimized loading for heavy routes
    const heavyRoutes = ["dashboard", "collections", "shoes", "runs"];
    return heavyRoutes.some((route) => routeName.includes(route));
  },

  // Get optimal loading configuration based on route
  getOptimalLoadingConfig: (routeName: string): RouteLoadingConfig => {
    const baseConfig =
      DEFAULT_LOADING_CONFIGS[routeName] || DEFAULT_LOADING_CONFIGS.form;

    // Adjust based on connection speed if available
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (
        connection?.effectiveType === "slow-2g" ||
        connection?.effectiveType === "2g"
      ) {
        return {
          ...baseConfig,
          holdDelay: Math.max(baseConfig.holdDelay! * 1.5, 300),
          skeletonDelay: Math.max(baseConfig.skeletonDelay! * 1.5, 400),
        };
      }
    }

    return baseConfig;
  },

  // Preload critical resources
  preloadCriticalResources: (resources: string[]) => {
    if (typeof document !== "undefined") {
      resources.forEach((resource) => {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = resource;
        link.as = "script";
        document.head.appendChild(link);
      });
    }
  },
};

// Auth-aware preloading helper
export async function createAuthAwareLoader(
  queryClient: QueryClient,
  loaderFn: () => Promise<any>,
) {
  try {
    // Check if user is authenticated before preloading
    const authQuery = queryClient.getQueryData([
      "convex",
      "auth.getUserProfile",
      {},
    ]);

    // Only execute loader if we have auth data
    if (!authQuery) {
      console.debug("No auth data available - skipping preload");
      return {};
    }

    return await loaderFn();
  } catch (error: any) {
    // Handle auth errors gracefully
    if (error?.message?.includes("not authenticated")) {
      console.debug("Auth error during preload (expected):", error);
      return {};
    }

    // Re-throw other errors
    throw error;
  }
}

// Enhanced query config with auth awareness
export function createAuthAwareQueryConfig(
  baseQuery: any,
  options?: {
    staleTime?: number;
    enabled?: boolean;
    requireAuth?: boolean;
  },
) {
  return {
    ...baseQuery,
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes default
    enabled: options?.enabled ?? true,
    onError: (error: any) => {
      // Only log auth errors in debug mode
      if (error?.message?.includes("not authenticated")) {
        console.debug("Auth error in query (expected):", error);
      } else {
        console.error("Query error:", error);
      }
    },
  };
}
