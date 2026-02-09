import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient, MutationCache } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { AuthProvider } from "./components/AuthProvider";
import { AppDataLoader } from "./components/AppDataLoader";
import "./utils/productionAuthDebug";

export function createRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
  if (!CONVEX_URL) {
    console.error("missing envar VITE_CONVEX_URL");
  }

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL, {
    skipConvexDeploymentUrlCheck: true,
  });

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        staleTime: 1000 * 60 * 5, // 5 minutes default
        gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (error?.message?.includes("not authenticated")) return false;
          return failureCount < 3;
        },
        // Optimistic network mode for better offline experience
        networkMode: "offlineFirst",
        // Refetch on window focus to keep data fresh
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect as Convex handles this
        refetchOnReconnect: false,
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error?.message?.includes("not authenticated")) return false;
          return failureCount < 2;
        },
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    }),
  });

  convexQueryClient.connect(queryClient);

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultErrorComponent: DefaultCatchBoundary,
      defaultNotFoundComponent: () => <NotFound />,
      defaultPreload: "intent", // Prefetch on hover/focus
      defaultPreloadDelay: 0, // No delay for faster prefetching
      defaultPendingMs: 100, // Prevent loading flash for quick loads
      defaultStaleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      defaultGcTime: 1000 * 60 * 15, // 15 minutes - keep in memory longer
      defaultShouldReload: false, // Don't reload if data is fresh
      context: { queryClient },
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          <ConvexAuthProvider client={convexQueryClient.convexClient}>
            <AuthProvider>
              <AppDataLoader>{children}</AppDataLoader>
            </AuthProvider>
          </ConvexAuthProvider>
        </ConvexProvider>
      ),
    }),
    queryClient,
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
