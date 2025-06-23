import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "~/components/AuthProvider";
import {
  usePrefetcher,
  prefetchShoeDetails,
  prefetchCollectionDetails,
  prefetchRunDetails,
  type PrefetchOptions,
} from "~/utils/prefetch";

/**
 * Enhanced hook for auth-aware prefetching with intelligent behavior
 */
export function useAuthAwarePrefetching() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const prefetcherData = usePrefetcher();
  const router = useRouter();

  const canPrefetch =
    isAuthenticated && !isLoading && prefetcherData?.canPrefetch;

  // Prefetch specific routes based on current context
  const prefetchRoute = useCallback(
    async (pathname: string, options: PrefetchOptions = {}) => {
      if (!canPrefetch || !prefetcherData?.prefetcher) return;

      await prefetcherData.prefetcher.prefetchForRoute(pathname, {
        ...options,
        requireAuth: true,
      });
    },
    [canPrefetch, prefetcherData?.prefetcher],
  );

  // Prefetch based on user behavior patterns
  const prefetchBehaviorBased = useCallback(
    async (options: PrefetchOptions = {}) => {
      if (!canPrefetch || !prefetcherData?.prefetcher) return;

      await prefetcherData.prefetcher.prefetchBasedOnBehavior({
        ...options,
        requireAuth: true,
      });
    },
    [canPrefetch, prefetcherData?.prefetcher],
  );

  // Prefetch critical data immediately
  const prefetchCritical = useCallback(
    async (options: PrefetchOptions = {}) => {
      if (!canPrefetch || !prefetcherData?.prefetcher) return;

      await prefetcherData.prefetcher.prefetchCriticalData({
        ...options,
        requireAuth: true,
      });
    },
    [canPrefetch, prefetcherData?.prefetcher],
  );

  return {
    canPrefetch,
    prefetchRoute,
    prefetchBehaviorBased,
    prefetchCritical,
    prefetcher: prefetcherData?.prefetcher,
    stats: prefetcherData?.stats,
  };
}

/**
 * Hook for prefetching on element interactions (hover, focus, touch)
 */
export function useInteractionPrefetch() {
  const { canPrefetch, prefetchRoute } = useAuthAwarePrefetching();
  const interactionRefs = useRef<Map<string, () => void>>(new Map());

  const attachPrefetch = useCallback(
    (
      element: HTMLElement | null,
      route: string,
      options: PrefetchOptions = {},
    ) => {
      if (!element || !canPrefetch) return;

      // Clean up existing listener if any
      const existingCleanup = interactionRefs.current.get(route);
      if (existingCleanup) {
        existingCleanup();
      }

      const prefetchHandler = () => {
        prefetchRoute(route, { background: true, delay: 0, ...options });
      };

      // Add event listeners
      element.addEventListener("mouseenter", prefetchHandler, {
        passive: true,
      });
      element.addEventListener("focusin", prefetchHandler, { passive: true });
      element.addEventListener("touchstart", prefetchHandler, {
        passive: true,
      });

      // Store cleanup function
      const cleanup = () => {
        element.removeEventListener("mouseenter", prefetchHandler);
        element.removeEventListener("focusin", prefetchHandler);
        element.removeEventListener("touchstart", prefetchHandler);
      };

      interactionRefs.current.set(route, cleanup);

      return cleanup;
    },
    [canPrefetch, prefetchRoute],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      interactionRefs.current.forEach((cleanup) => cleanup());
      interactionRefs.current.clear();
    };
  }, []);

  return { attachPrefetch };
}

/**
 * Hook for viewport-based prefetching using Intersection Observer
 */
export function useViewportPrefetch() {
  const { canPrefetch, prefetchRoute } = useAuthAwarePrefetching();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElements = useRef<Set<Element>>(new Set());

  const observeElement = useCallback(
    (element: Element, route: string, options: PrefetchOptions = {}) => {
      if (!element || !canPrefetch || !("IntersectionObserver" in window))
        return;

      // Initialize observer if needed
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const link = entry.target as HTMLAnchorElement;
                const href = link.getAttribute("data-prefetch-route");
                if (href) {
                  prefetchRoute(href, {
                    background: true,
                    delay: 500,
                    priority: "low",
                    ...options,
                  });
                }
              }
            });
          },
          {
            rootMargin: "100px",
            threshold: 0.1,
          },
        );
      }

      // Add route data to element
      element.setAttribute("data-prefetch-route", route);

      // Start observing
      observerRef.current.observe(element);
      observedElements.current.add(element);
    },
    [canPrefetch, prefetchRoute],
  );

  const unobserveElement = useCallback((element: Element) => {
    if (observerRef.current && observedElements.current.has(element)) {
      observerRef.current.unobserve(element);
      observedElements.current.delete(element);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      observedElements.current.clear();
    };
  }, []);

  return { observeElement, unobserveElement };
}

/**
 * Hook for route-specific prefetching strategies
 */
export function useRoutePrefetch(currentRoute: string) {
  const { canPrefetch, prefetcher } = useAuthAwarePrefetching();
  const queryClient = useQueryClient();
  const hasInitialized = useRef(false);

  // Initialize route-specific prefetching
  useEffect(() => {
    if (!canPrefetch || !prefetcher || hasInitialized.current) return;

    hasInitialized.current = true;

    // Prefetch based on current route
    const initializePrefetch = async () => {
      // Prefetch current route data
      await prefetcher.prefetchForRoute(currentRoute, {
        background: true,
        delay: 100,
        requireAuth: true,
      });

      // Prefetch likely next routes
      await prefetcher.preloadLikelyRoutes(currentRoute, {
        requireAuth: true,
      });

      // Start behavior-based prefetching after a delay
      setTimeout(() => {
        prefetcher.prefetchBasedOnBehavior({
          background: true,
          priority: "low",
          requireAuth: true,
        });
      }, 2000);
    };

    initializePrefetch().catch((error) => {
      console.debug("Route prefetch initialization failed:", error);
    });
  }, [canPrefetch, prefetcher, currentRoute]);

  return { canPrefetch, prefetcher };
}

/**
 * Hook for prefetching specific entity details
 */
export function useEntityPrefetch() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const canPrefetch = isAuthenticated && !isLoading;

  const prefetchShoe = useCallback(
    async (shoeId: string, options: PrefetchOptions = {}) => {
      if (!canPrefetch) return;
      await prefetchShoeDetails(queryClient, shoeId, options);
    },
    [canPrefetch, queryClient],
  );

  const prefetchCollection = useCallback(
    async (collectionId: string, options: PrefetchOptions = {}) => {
      if (!canPrefetch) return;
      await prefetchCollectionDetails(queryClient, collectionId, options);
    },
    [canPrefetch, queryClient],
  );

  const prefetchRun = useCallback(
    async (runId: string, options: PrefetchOptions = {}) => {
      if (!canPrefetch) return;
      await prefetchRunDetails(queryClient, runId, options);
    },
    [canPrefetch, queryClient],
  );

  return {
    canPrefetch,
    prefetchShoe,
    prefetchCollection,
    prefetchRun,
  };
}

/**
 * Hook for monitoring prefetch performance
 */
export function usePrefetchMonitoring() {
  const prefetcherData = usePrefetcher();
  const [stats, setStats] = useState(prefetcherData?.stats || null);

  useEffect(() => {
    if (!prefetcherData?.prefetcher) return;

    const interval = setInterval(() => {
      setStats(prefetcherData.prefetcher.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [prefetcherData?.prefetcher]);

  return {
    stats,
    canPrefetch: prefetcherData?.canPrefetch || false,
    isAuthenticated: prefetcherData?.isAuthenticated || false,
  };
}

/**
 * Hook for prefetching on route transitions
 */
export function useTransitionPrefetch() {
  const router = useRouter();
  const { prefetchRoute } = useAuthAwarePrefetching();
  const lastRoute = useRef<string>("");

  useEffect(() => {
    const currentPath = router.state.location.pathname;

    // Skip if same route
    if (lastRoute.current === currentPath) return;

    lastRoute.current = currentPath;

    // Prefetch likely next routes based on current route
    const prefetchNext = async () => {
      const nextRoutes = getPotentialNextRoutes(currentPath);
      for (const route of nextRoutes) {
        await prefetchRoute(route, {
          background: true,
          delay: 1000,
          priority: "low",
        });
      }
    };

    // Delay to avoid interfering with current route loading
    setTimeout(prefetchNext, 2000);
  }, [router.state.location.pathname, prefetchRoute]);
}

/**
 * Helper function to determine potential next routes based on current route
 */
function getPotentialNextRoutes(currentPath: string): string[] {
  const routes: string[] = [];

  if (currentPath === "/" || currentPath === "/shoes") {
    routes.push("/runs", "/collections", "/analytics");
  } else if (
    currentPath.startsWith("/shoes/") &&
    !currentPath.includes("/edit")
  ) {
    routes.push("/runs", "/shoes", `${currentPath}/edit`);
  } else if (currentPath === "/runs") {
    routes.push("/shoes", "/runs/new");
  } else if (currentPath.startsWith("/runs/")) {
    routes.push("/runs", "/shoes");
  } else if (currentPath === "/collections") {
    routes.push("/shoes", "/collections/new");
  } else if (currentPath.startsWith("/collections/")) {
    routes.push("/collections", "/shoes");
  } else if (currentPath === "/analytics") {
    routes.push("/shoes", "/runs", "/collections");
  }

  return routes;
}

/**
 * Combined hook that provides all prefetching functionality
 */
export function usePrefetching() {
  const authAwarePrefetch = useAuthAwarePrefetching();
  const entityPrefetch = useEntityPrefetch();
  const interactionPrefetch = useInteractionPrefetch();
  const viewportPrefetch = useViewportPrefetch();

  return {
    ...authAwarePrefetch,
    ...entityPrefetch,
    ...interactionPrefetch,
    ...viewportPrefetch,
  };
}
