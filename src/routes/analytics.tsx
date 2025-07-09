import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { PageLoading } from "~/components/LoadingStates";
import { AnalyticsDashboard } from "~/components/analytics/AnalyticsDashboard";
import { SmartPageLoading } from "~/components/loading/RouteHolding";
import { requireAuth } from "~/utils/auth";

import {
  statsQueries,
  runQueries,
  shoeQueries,
  collectionQueries,
} from "~/queries";

function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <AnalyticsDashboard />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  beforeLoad: async ({ context: { queryClient } }) => {
    // Start prefetching related data before the route loads
    const prefetchPromises = [
      queryClient.prefetchQuery({
        ...runQueries.list(100),
        staleTime: 1000 * 60 * 2,
      }),
      queryClient.prefetchQuery({
        ...collectionQueries.list(),
        staleTime: 1000 * 60 * 5,
      }),
    ];

    // Fire and forget - don't block navigation
    Promise.all(prefetchPromises).catch(() => {});

    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Preload analytics data and related information
    const statsPromise = queryClient.ensureQueryData(statsQueries.overall());
    const runsPromise = queryClient.ensureQueryData(runQueries.withShoes(200));
    const shoesPromise = queryClient.ensureQueryData(shoeQueries.list(true));

    // Wait for critical data
    await Promise.all([statsPromise, runsPromise, shoesPromise]);

    return { user };
  },
  // Route-level caching configuration
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  shouldReload: false, // Don't reload if data is fresh
});
