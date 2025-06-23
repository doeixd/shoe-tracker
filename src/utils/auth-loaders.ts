import { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "../queries";
import { getPrefetcher } from "./prefetch";

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
    const prefetcher = getPrefetcher();

    // Check auth state if required
    if (requireAuth && prefetcher) {
      const authState = prefetcher.getAuthState();

      // If still loading auth, wait a bit
      if (authState.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const updatedAuthState = prefetcher.getAuthState();

        if (updatedAuthState.isLoading) {
          // Still loading after wait, allow through but don't prefetch
          console.warn("Auth state still loading, proceeding without prefetch");
          return {};
        }
      }

      // Check final auth state
      if (!prefetcher.isAuthenticated()) {
        // Not authenticated, redirect
        console.info("User not authenticated, redirecting to sign in");
        throw redirect({ to: redirectTo });
      }
    }

    try {
      // Execute critical queries first
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

      // Start background prefetching if enabled
      if (prefetchInBackground && backgroundQueries.length > 0) {
        // Don't await these - let them run in background
        backgroundQueries.forEach((queryFn) => {
          queryClient.prefetchQuery(queryFn()).catch((error) => {
            // Silently handle background prefetch errors
            console.debug("Background prefetch failed:", error);
          });
        });
      }

      return {};
    } catch (error: any) {
      // Handle specific error types
      if (error?.message?.includes("not authenticated")) {
        console.info("Authentication error in loader, redirecting");
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

// Predefined loaders for common routes
export const shoesIndexLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const loader = await createAuthAwareLoader({
    criticalQueries: [
      () => shoeQueries.list(false),
      () => shoeQueries.list(true),
      () => collectionQueries.list(),
    ],
    backgroundQueries: [
      () => runQueries.withShoes(20),
      () => statsQueries.overall(),
    ],
  });
  return loader({ context });
};

export const runsIndexLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const loader = await createAuthAwareLoader({
    criticalQueries: [
      () => runQueries.withShoes(50),
      () => shoeQueries.list(false),
    ],
    backgroundQueries: [
      () => collectionQueries.list(),
      () => statsQueries.overall(),
    ],
  });
  return loader({ context });
};

export const collectionsIndexLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const loader = await createAuthAwareLoader({
    criticalQueries: [
      () => collectionQueries.list(),
      () => collectionQueries.archived(),
    ],
    backgroundQueries: [
      () => shoeQueries.list(false),
      () => runQueries.withShoes(20),
    ],
  });
  return loader({ context });
};

export const analyticsLoader = async ({
  context,
}: {
  context: LoaderContext;
}) => {
  const loader = await createAuthAwareLoader({
    criticalQueries: [() => statsQueries.overall()],
    backgroundQueries: [
      () => runQueries.withShoes(200),
      () => shoeQueries.list(false),
      () => collectionQueries.list(),
    ],
  });
  return loader({ context });
};

// Dynamic loaders that accept parameters
export function createShoeDetailLoader(shoeId: string) {
  return async ({ context }: { context: LoaderContext }) => {
    const loader = await createAuthAwareLoader({
      criticalQueries: [
        () => shoeQueries.detail(shoeId),
        () => shoeQueries.withStats(shoeId),
      ],
      backgroundQueries: [
        () => runQueries.list(50, shoeId),
        () => collectionQueries.list(),
      ],
    });
    return loader({ context });
  };
}

export function createCollectionDetailLoader(collectionId: string) {
  return async ({ context }: { context: LoaderContext }) => {
    const loader = await createAuthAwareLoader({
      criticalQueries: [
        () => collectionQueries.detail(collectionId),
        () => shoeQueries.byCollection(collectionId, false),
      ],
      backgroundQueries: [
        () => shoeQueries.byCollection(collectionId, true),
        () => runQueries.withShoes(50),
      ],
    });
    return loader({ context });
  };
}

export function createRunDetailLoader(runId: string) {
  return async ({ context }: { context: LoaderContext }) => {
    const loader = await createAuthAwareLoader({
      criticalQueries: [() => runQueries.detail(runId)],
      backgroundQueries: [
        () => shoeQueries.list(false),
        () => runQueries.withShoes(20),
      ],
    });
    return loader({ context });
  };
}

// Utility for route-specific prefetching
export async function prefetchForRoute(
  queryClient: QueryClient,
  route: string,
  params?: Record<string, string>,
) {
  const prefetcher = getPrefetcher();

  if (!prefetcher?.isAuthenticated()) {
    return;
  }

  try {
    switch (route) {
      case "/shoes":
        await Promise.allSettled([
          queryClient.prefetchQuery(shoeQueries.list(false)),
          queryClient.prefetchQuery(collectionQueries.list()),
        ]);
        break;

      case "/shoes/:shoeId":
        if (params?.shoeId) {
          await Promise.allSettled([
            queryClient.prefetchQuery(shoeQueries.detail(params.shoeId)),
            queryClient.prefetchQuery(shoeQueries.withStats(params.shoeId)),
          ]);
        }
        break;

      case "/runs":
        await Promise.allSettled([
          queryClient.prefetchQuery(runQueries.withShoes(50)),
          queryClient.prefetchQuery(shoeQueries.list(false)),
        ]);
        break;

      case "/runs/:runId":
        if (params?.runId) {
          await queryClient.prefetchQuery(runQueries.detail(params.runId));
        }
        break;

      case "/collections":
        await Promise.allSettled([
          queryClient.prefetchQuery(collectionQueries.list()),
          queryClient.prefetchQuery(shoeQueries.list(false)),
        ]);
        break;

      case "/collections/:collectionId":
        if (params?.collectionId) {
          await Promise.allSettled([
            queryClient.prefetchQuery(
              collectionQueries.detail(params.collectionId),
            ),
            queryClient.prefetchQuery(
              shoeQueries.byCollection(params.collectionId, false),
            ),
          ]);
        }
        break;

      case "/analytics":
        await Promise.allSettled([
          queryClient.prefetchQuery(statsQueries.overall()),
          queryClient.prefetchQuery(runQueries.withShoes(100)),
        ]);
        break;

      default:
        // Default prefetch for unknown routes
        await Promise.allSettled([
          queryClient.prefetchQuery(shoeQueries.list(false)),
          queryClient.prefetchQuery(collectionQueries.list()),
        ]);
    }
  } catch (error) {
    console.debug("Route prefetch failed:", error);
  }
}

// Error boundary helper for loaders
export function handleLoaderError(error: any, route: string) {
  console.error(`Loader error on ${route}:`, error);

  if (error?.message?.includes("not authenticated")) {
    return redirect({ to: "/auth/signin" });
  }

  if (error?.message?.includes("not found")) {
    toast.error("The requested resource was not found");
    return redirect({ to: "/" });
  }

  if (error?.message?.includes("network")) {
    toast.error("Network error. Please check your connection.");
  }

  // For other errors, let the error boundary handle it
  throw error;
}

// Performance monitoring for loaders
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
