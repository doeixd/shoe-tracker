import { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "../queries";

export interface LoaderContext {
  queryClient: QueryClient;
}

export interface AuthAwareLoaderOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  prefetchInBackground?: boolean;
  criticalQueries?: Array<() => any>;
  backgroundQueries?: Array<() => any>;
  timeout?: number;
}

/**
 * Enhanced loader that handles auth state and provides intelligent prefetching
 */
export async function createAuthAwareLoader(
  options: AuthAwareLoaderOptions = {},
) {
  const {
    requireAuth = true,
    redirectTo = "/auth/signin",
    prefetchInBackground = true,
    criticalQueries = [],
    backgroundQueries = [],
    timeout = 10000,
  } = options;

  return async ({ context }: { context: LoaderContext }) => {
    const { queryClient } = context;

    // TanStack Router and Convex handle auth state automatically
    // Just handle the critical queries

    try {
      // Execute critical queries if provided
      if (criticalQueries.length > 0) {
        const criticalPromises = criticalQueries.map((queryFn) =>
          queryClient.ensureQueryData(queryFn()),
        );

        // Wait for critical data with timeout
        await Promise.race([
          Promise.all(criticalPromises),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Loader timeout")), timeout),
          ),
        ]);
      }

      return {};
    } catch (error: any) {
      // Handle authentication errors
      if (error?.message?.includes("not authenticated")) {
        throw redirect({ to: redirectTo });
      }

      if (error?.message?.includes("Loader timeout")) {
        console.warn("Loader timeout - continuing with partial data");
        toast.error("Loading is taking longer than expected");
        return {};
      }

      // Let other errors bubble up
      throw error;
    }
  };
}

// Simplified loaders that just prefetch critical data
export const shoesIndexLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const { queryClient } = context;

  // Prefetch critical data - TanStack Router handles auth automatically
  await Promise.allSettled([
    queryClient.prefetchQuery(shoeQueries.list(true)),
    queryClient.prefetchQuery(collectionQueries.list()),
  ]);

  return {};
};

export const runsIndexLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const { queryClient } = context;

  await Promise.allSettled([
    queryClient.prefetchQuery(runQueries.withShoes(50)),
    queryClient.prefetchQuery(shoeQueries.list(false)),
  ]);

  return {};
};

export const collectionsIndexLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const { queryClient } = context;

  await Promise.allSettled([
    queryClient.prefetchQuery(collectionQueries.list()),
    queryClient.prefetchQuery(collectionQueries.archived()),
  ]);

  return {};
};

export const analyticsLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const { queryClient } = context;

  await queryClient.prefetchQuery(statsQueries.overall());

  return {};
};

// Simplified dynamic loaders
export function createShoeDetailLoader(shoeId: string) {
  return async ({ context }: { context: LoaderContext }) => {
    const { queryClient } = context;

    await Promise.allSettled([
      queryClient.prefetchQuery(shoeQueries.detail(shoeId)),
      queryClient.prefetchQuery(shoeQueries.withStats(shoeId)),
    ]);

    return {};
  };
}

export function createCollectionDetailLoader(collectionId: string) {
  return async ({ context }: { context: LoaderContext }) => {
    const { queryClient } = context;

    await Promise.allSettled([
      queryClient.prefetchQuery(collectionQueries.detail(collectionId)),
      queryClient.prefetchQuery(shoeQueries.byCollection(collectionId, false)),
    ]);

    return {};
  };
}

export function createRunDetailLoader(runId: string) {
  return async ({ context }: { context: LoaderContext }) => {
    const { queryClient } = context;

    await queryClient.prefetchQuery(runQueries.detail(runId));

    return {};
  };
}

// Simple error boundary helper for loaders
export function handleLoaderError(error: any, route: string) {
  console.error(`Loader error on ${route}:`, error);

  if (error?.message?.includes("not authenticated")) {
    throw redirect({ to: "/auth/signin", search: { redirect: "/" } });
  }

  // For other errors, let TanStack Router's error boundary handle it
  throw error;
}
export class LoaderPerformanceMonitor {
  private static timings: Map<string, number[]> = new Map();

  static startTiming(route: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const routeTimings = this.timings.get(route) || [];
      routeTimings.push(duration);

      // Keep only last 10 measurements
      if (routeTimings.length > 10) {
        routeTimings.shift();
      }

      this.timings.set(route, routeTimings);

      // Log slow loaders in development
      if (process.env.NODE_ENV === "development" && duration > 2000) {
        console.warn(
          `Slow loader detected for ${route}: ${Math.round(duration)}ms`,
        );
      }
    };
  }

  static getStats(route?: string) {
    if (route) {
      const timings = this.timings.get(route) || [];
      return {
        route,
        count: timings.length,
        average: timings.length
          ? timings.reduce((a, b) => a + b) / timings.length
          : 0,
        latest: timings[timings.length - 1] || 0,
      };
    }

    const allStats = Array.from(this.timings.entries()).map(
      ([route, timings]) => ({
        route,
        count: timings.length,
        average: timings.reduce((a, b) => a + b) / timings.length,
        latest: timings[timings.length - 1],
      }),
    );

    return allStats.sort((a, b) => b.average - a.average);
  }
}

// Hook for using loader performance monitoring
export function useLoaderTiming(route: string) {
  const endTiming = LoaderPerformanceMonitor.startTiming(route);

  return {
    endTiming,
    getStats: () => LoaderPerformanceMonitor.getStats(route),
  };
}
