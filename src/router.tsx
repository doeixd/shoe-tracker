import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
  MutationCache,
  QueryClient,
  notifyManager,
} from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { toast } from "sonner";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { AuthProvider } from "./components/AuthProvider";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "./queries";
import { createPrefetcher, type AuthState } from "./utils/prefetch";

// Route holding mechanism - delay showing loading spinners
let routeHoldTimeout: NodeJS.Timeout | null = null;
const ROUTE_HOLD_DELAY = 200; // 200ms delay before showing spinner

// Auth-aware initialization state
let authInitialized = false;
let initialPrefetchComplete = false;

export function createRouter() {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    console.error("missing envar CONVEX_URL");
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL, {
    skipConvexDeploymentUrlCheck: true,
  });

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        // Aggressive caching for instant navigation
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
        // Enable background refetching
        refetchOnWindowFocus: true,
        refetchOnMount: "always",
        // Enhanced retry logic for auth-aware queries
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (
            error?.message?.includes("not authenticated") ||
            error?.message?.includes("Unauthorized") ||
            error?.message?.includes("access denied")
          ) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        if (
          !error.message?.includes("not authenticated") &&
          !error.message?.includes("Loading")
        ) {
          toast.error(error.message);
        }
      },
    }),
  });
  convexQueryClient.connect(queryClient);

  // Create auth-aware intelligent prefetcher
  const prefetcher = createPrefetcher(queryClient);

  // Auth state change handler
  const handleAuthStateChange = (authState: AuthState) => {
    if (!authInitialized && !authState.isLoading) {
      authInitialized = true;

      if (authState.isAuthenticated) {
        // Start initial prefetching after auth is confirmed
        setTimeout(() => {
          try {
            prefetcher.prefetchCriticalData({
              background: true,
              delay: 100,
              requireAuth: true,
            });
            initialPrefetchComplete = true;
          } catch (error) {
            console.debug("Initial prefetch failed:", error);
          }
        }, 500);

        // Start behavior-based prefetching after initial load
        setTimeout(() => {
          try {
            prefetcher.prefetchBasedOnBehavior({
              background: true,
              priority: "low",
            });
          } catch (error) {
            console.debug("Behavior prefetch failed:", error);
          }
        }, 5000);
      } else {
        // User is not authenticated, reset prefetch state
        initialPrefetchComplete = false;
      }
    }
  };

  // Set up auth state listener
  if (typeof window !== "undefined") {
    const authListener = (event: CustomEvent) => {
      handleAuthStateChange(event.detail);
    };

    window.addEventListener("auth-state-change", authListener as EventListener);

    // Cleanup function for router teardown
    const cleanup = () => {
      window.removeEventListener(
        "auth-state-change",
        authListener as EventListener,
      );
      prefetcher.cleanup();
    };

    // Store cleanup for potential future use
    (window as any).__routerCleanup = cleanup;
  }

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      // Conservative preloading strategy - only when auth is confirmed
      defaultPreload: false, // Disable automatic preloading
      defaultPreloadDelay: 100, // Reduced from 200ms
      defaultPreloadGcTime: 1000 * 60 * 10, // Keep preloaded data for 10 minutes
      defaultPreloadStaleTime: 1000 * 60 * 5, // Consider preloaded data fresh for 5 minutes

      // Route holding configuration - minimal delay for better UX
      defaultPendingMs: 200, // Reduced from 1000ms to 200ms
      defaultPendingMinMs: 200, // Reduced from 500ms to 200ms

      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      context: { queryClient },

      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          <ConvexAuthProvider client={convexQueryClient.convexClient}>
            <AuthProvider>{children}</AuthProvider>
          </ConvexAuthProvider>
        </ConvexProvider>
      ),
      scrollRestoration: true,
    }),
    queryClient,
  );

  // Enhanced link prefetching using auth-aware intelligent prefetcher
  if (typeof window !== "undefined") {
    const prefetchOnInteraction = (event: Event) => {
      // Only prefetch if authenticated and prefetcher is ready
      if (!prefetcher.isAuthenticated() || !authInitialized) {
        return;
      }

      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (link && link.href) {
        try {
          const url = new URL(link.href);

          // Skip external links
          if (url.origin !== window.location.origin) {
            return;
          }

          const pathname = url.pathname;

          // Use intelligent prefetcher for immediate interaction-based prefetching
          prefetcher.prefetchForRoute(pathname, {
            background: true,
            delay: 0,
            priority: "high",
            requireAuth: true,
          });
        } catch (error) {
          // Silently handle URL parsing errors
          console.debug("Prefetch URL error:", error);
        }
      }
    };

    // Optimized event listeners with passive options
    const eventOptions = { passive: true, capture: false };

    // Mouseover for desktop hover prefetching
    document.addEventListener("mouseover", prefetchOnInteraction, eventOptions);

    // Focus for keyboard navigation
    document.addEventListener("focusin", prefetchOnInteraction, eventOptions);

    // Touch events for mobile
    document.addEventListener(
      "touchstart",
      prefetchOnInteraction,
      eventOptions,
    );

    // Cleanup event listeners
    const cleanupEventListeners = () => {
      document.removeEventListener("mouseover", prefetchOnInteraction);
      document.removeEventListener("focusin", prefetchOnInteraction);
      document.removeEventListener("touchstart", prefetchOnInteraction);
    };

    // Store cleanup for router teardown
    const existingCleanup = (window as any).__routerCleanup;
    (window as any).__routerCleanup = () => {
      existingCleanup?.();
      cleanupEventListeners();
    };

    // Periodic intelligent prefetching based on user behavior (only when authenticated)
    const behaviorPrefetchInterval = setInterval(() => {
      if (
        prefetcher.isAuthenticated() &&
        authInitialized &&
        initialPrefetchComplete
      ) {
        try {
          prefetcher.prefetchBasedOnBehavior({
            background: true,
            priority: "low",
            requireAuth: true,
          });
        } catch (error) {
          console.debug("Background prefetch error:", error);
        }
      }
    }, 60000); // Every 60 seconds

    // Enhanced cleanup
    const finalCleanup = (window as any).__routerCleanup;
    (window as any).__routerCleanup = () => {
      finalCleanup?.();
      clearInterval(behaviorPrefetchInterval);
    };

    // Intersection Observer for viewport-based prefetching
    if ("IntersectionObserver" in window) {
      const prefetchObserver = new IntersectionObserver(
        (entries) => {
          if (!prefetcher.isAuthenticated() || !authInitialized) return;

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const link = entry.target as HTMLAnchorElement;
              if (link && link.href) {
                try {
                  const url = new URL(link.href);
                  if (url.origin === window.location.origin) {
                    // Prefetch with lower priority for viewport-based prefetching
                    prefetcher.prefetchForRoute(url.pathname, {
                      background: true,
                      delay: 500,
                      priority: "low",
                      requireAuth: true,
                    });
                  }
                } catch (error) {
                  console.debug("Viewport prefetch error:", error);
                }
              }
            }
          });
        },
        {
          rootMargin: "100px", // Start prefetching 100px before element comes into view
          threshold: 0.1,
        },
      );

      // Observe all links after auth is established
      setTimeout(() => {
        if (prefetcher.isAuthenticated() && authInitialized) {
          try {
            document.querySelectorAll("a[href]").forEach((link) => {
              prefetchObserver.observe(link);
            });
          } catch (error) {
            console.debug("Observer setup error:", error);
          }
        }
      }, 3000);

      // Enhanced cleanup
      const observerCleanup = (window as any).__routerCleanup;
      (window as any).__routerCleanup = () => {
        observerCleanup?.();
        prefetchObserver.disconnect();
      };
    }

    // Performance monitoring for prefetch effectiveness
    if (process.env.NODE_ENV === "development") {
      setInterval(() => {
        const stats = prefetcher.getStats();
        console.debug("Prefetcher Stats:", stats);
      }, 60000); // Log stats every minute in development
    }
  }

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
