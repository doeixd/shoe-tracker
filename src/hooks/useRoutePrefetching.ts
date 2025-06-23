import { useEffect, useRef } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "~/queries";
import { getPrefetcher } from "~/utils/prefetch";

interface RoutePrefetchingOptions {
  enabled?: boolean;
  aggressiveness?: "low" | "medium" | "high";
  prefetchOnIdle?: boolean;
  prefetchOnVisible?: boolean;
}

export function useRoutePrefetching(options: RoutePrefetchingOptions = {}) {
  const {
    enabled = true,
    aggressiveness = "medium",
    prefetchOnIdle = true,
    prefetchOnVisible = true,
  } = options;

  const queryClient = useQueryClient();
  const router = useRouter();
  const location = useLocation();
  const prefetcher = getPrefetcher();
  const prefetchedRoutes = useRef(new Set<string>());
  const isVisible = useRef(true);

  // Track visibility for performance optimization
  useEffect(() => {
    if (!enabled || !prefetchOnVisible) return;

    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, prefetchOnVisible]);

  // Main prefetching effect
  useEffect(() => {
    if (!enabled || !prefetcher) return;

    const currentPath = location.pathname;

    // Skip if already prefetched this route
    if (prefetchedRoutes.current.has(currentPath)) return;

    const prefetchCurrentRoute = async () => {
      try {
        // Skip if page is not visible and visibility checking is enabled
        if (prefetchOnVisible && !isVisible.current) return;

        // Mark as prefetched
        prefetchedRoutes.current.add(currentPath);

        // Prefetch current route data
        await prefetcher.prefetchForRoute(currentPath, {
          background: true,
          priority: "high",
        });

        // Prefetch related routes based on aggressiveness
        const relatedRoutes = getRelatedRoutes(currentPath, aggressiveness);
        for (const route of relatedRoutes) {
          if (!prefetchedRoutes.current.has(route)) {
            await prefetcher.prefetchForRoute(route, {
              background: true,
              priority: "low",
              delay: 100,
            });
            prefetchedRoutes.current.add(route);
          }
        }

        // Behavior-based prefetching
        await prefetcher.prefetchBasedOnBehavior({
          background: true,
          priority: "low",
        });
      } catch (error) {
        console.debug("Route prefetching failed:", error);
      }
    };

    // Execute prefetching based on options
    if (prefetchOnIdle && "requestIdleCallback" in window) {
      window.requestIdleCallback(prefetchCurrentRoute, { timeout: 2000 });
    } else {
      // Small delay to not block initial render
      setTimeout(prefetchCurrentRoute, 50);
    }
  }, [
    enabled,
    location.pathname,
    aggressiveness,
    prefetchOnIdle,
    prefetchOnVisible,
    prefetcher,
  ]);

  // Prefetch on link interactions
  useEffect(() => {
    if (!enabled) return;

    const handleLinkInteraction = (event: Event) => {
      if (!isVisible.current && prefetchOnVisible) return;

      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (link && link.href) {
        const url = new URL(link.href);
        const pathname = url.pathname;

        // Skip external links
        if (url.origin !== window.location.origin) return;

        // Skip if already prefetched
        if (prefetchedRoutes.current.has(pathname)) return;

        // Prefetch on interaction
        prefetcher?.prefetchForRoute(pathname, {
          background: true,
          priority: "high",
          delay: 0,
        });

        prefetchedRoutes.current.add(pathname);
      }
    };

    // Add interaction listeners
    document.addEventListener("mouseenter", handleLinkInteraction, {
      passive: true,
      capture: true,
    });
    document.addEventListener("focusin", handleLinkInteraction, {
      passive: true,
      capture: true,
    });
    document.addEventListener("touchstart", handleLinkInteraction, {
      passive: true,
      capture: true,
    });

    return () => {
      document.removeEventListener("mouseenter", handleLinkInteraction, {
        capture: true,
      });
      document.removeEventListener("focusin", handleLinkInteraction, {
        capture: true,
      });
      document.removeEventListener("touchstart", handleLinkInteraction, {
        capture: true,
      });
    };
  }, [enabled, prefetchOnVisible, prefetcher]);

  return {
    prefetchRoute: (pathname: string) => {
      if (!prefetcher) return;
      return prefetcher.prefetchForRoute(pathname, {
        background: false,
        priority: "high",
      });
    },
    getPrefetchStats: () => prefetcher?.getStats(),
    clearPrefetchCache: () => {
      prefetchedRoutes.current.clear();
      prefetcher?.reset();
    },
  };
}

// Get related routes that should be prefetched based on current route
function getRelatedRoutes(
  currentPath: string,
  aggressiveness: "low" | "medium" | "high",
): string[] {
  const routes: string[] = [];

  // Base routes that are commonly accessed
  const commonRoutes = ["/", "/shoes", "/runs", "/collections"];

  if (currentPath === "/") {
    // From home, likely to go to main sections
    routes.push("/shoes", "/runs", "/collections");
    if (aggressiveness !== "low") {
      routes.push("/analytics");
    }
  } else if (currentPath === "/shoes" || currentPath === "/shoes/") {
    // From shoes index, likely to go to specific shoes or related areas
    routes.push("/collections", "/runs");
    if (aggressiveness === "high") {
      routes.push("/analytics", "/shoes/new");
    }
  } else if (currentPath.startsWith("/shoes/") && !currentPath.includes("edit")) {
    // From shoe detail, likely to go to runs or edit
    routes.push("/runs", "/shoes");
    if (aggressiveness !== "low") {
      routes.push("/collections");
      if (currentPath.match(/\/shoes\/[^\/]+$/)) {
        routes.push(`${currentPath}/edit`);
      }
    }
  } else if (currentPath === "/runs" || currentPath === "/runs/") {
    // From runs index, likely to go to shoes or add new run
    routes.push("/shoes", "/collections");
    if (aggressiveness === "high") {
      routes.push("/runs/new", "/analytics");
    }
  } else if (currentPath.startsWith("/runs/") && currentPath !== "/runs/new") {
    // From run detail, likely to go to shoes or runs list
    routes.push("/runs", "/shoes");
    if (aggressiveness !== "low") {
      routes.push("/collections");
    }
  } else if (currentPath === "/collections" || currentPath === "/collections/") {
    // From collections index, likely to go to shoes or specific collection
    routes.push("/shoes", "/runs");
    if (aggressiveness === "high") {
      routes.push("/collections/new");
    }
  } else if (currentPath.startsWith("/collections/")) {
    // From collection detail, likely to go to shoes or collections list
    routes.push("/collections", "/shoes");
    if (aggressiveness !== "low") {
      routes.push("/runs", "/shoes/new");
    }
  } else if (currentPath === "/analytics") {
    // From analytics, likely to go to main data sections
    routes.push("/shoes", "/runs", "/collections");
  }

  // Add common routes based on aggressiveness
  if (aggressiveness === "high") {
    routes.push(...commonRoutes.filter((route) => route !== currentPath));
  }

  // Remove duplicates and current path
  return [...new Set(routes)].filter((route) => route !== currentPath);
}

// Hook for specific route prefetching scenarios
export function useSpecificPrefetching() {
  const queryClient = useQueryClient();

  return {
    prefetchShoeDetails: async (shoeId: string) => {
      await Promise.allSettled([
        queryClient.prefetchQuery(shoeQueries.detail(shoeId)),
        queryClient.prefetchQuery(shoeQueries.withStats(shoeId)),
        queryClient.prefetchQuery(runQueries.list(50, shoeId)),
      ]);
    },

    prefetchCollectionDetails: async (collectionId: string) => {
      await Promise.allSettled([
        queryClient.prefetchQuery(collectionQueries.detail(collectionId)),
        queryClient.prefetchQuery(
          shoeQueries.byCollection(collectionId, false),
        ),
        queryClient.prefetchQuery(shoeQueries.byCollection(collectionId, true)),
      ]);
    },

    prefetchRunDetails: async (runId: string) => {
      await queryClient.prefetchQuery(runQueries.detail(runId));
    },

    prefetchAllCritical: async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery(collectionQueries.list()),
        queryClient.prefetchQuery(shoeQueries.list(false)),
        queryClient.prefetchQuery(runQueries.withShoes(50)),
        queryClient.prefetchQuery(statsQueries.overall()),
      ]);
    },

    prefetchForNewUser: async () => {
      // Prefetch data that new users typically need
      await Promise.allSettled([
        queryClient.prefetchQuery(collectionQueries.list()),
        queryClient.prefetchQuery(shoeQueries.list(false)),
        queryClient.prefetchQuery(runQueries.withShoes(10)),
      ]);
    },
  };
}

// Hook for background prefetching strategies
export function useBackgroundPrefetching(enabled = true) {
  const queryClient = useQueryClient();
  const prefetcher = getPrefetcher();

  useEffect(() => {
    if (!enabled || !prefetcher) return;

    // Periodic background prefetching
    const backgroundPrefetch = async () => {
      try {
        // Only prefetch if page is visible
        if (document.hidden) return;

        // Behavior-based prefetching
        await prefetcher.prefetchBasedOnBehavior({
          background: true,
          priority: "low",
        });

        // Refresh stale critical data
        const staleTime = 1000 * 60 * 5; // 5 minutes
        const now = Date.now();

        const criticalQueries = [
          collectionQueries.list(),
          shoeQueries.list(false),
          statsQueries.overall(),
        ];

        for (const query of criticalQueries) {
          const cachedData = queryClient.getQueryData(query.queryKey);
          const queryState = queryClient.getQueryState(query.queryKey);

          if (
            cachedData &&
            queryState?.dataUpdatedAt &&
            now - queryState.dataUpdatedAt > staleTime
          ) {
            queryClient.prefetchQuery(query);
          }
        }
      } catch (error) {
        console.debug("Background prefetching failed:", error);
      }
    };

    // Run background prefetching every 30 seconds
    const interval = setInterval(backgroundPrefetch, 30000);

    // Run initial background prefetch after 5 seconds
    const initialTimeout = setTimeout(backgroundPrefetch, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [enabled, queryClient, prefetcher]);
}
