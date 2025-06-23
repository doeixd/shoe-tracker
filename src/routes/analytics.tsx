import { createFileRoute } from "@tanstack/react-router";
import { withAuth } from "~/components/AuthProvider";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { PageLoading } from "~/components/LoadingStates";
import { AnalyticsDashboard } from "~/components/analytics/AnalyticsDashboard";
import { SmartPageLoading } from "~/components/loading/RouteHolding";

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
  component: withAuth(AnalyticsPage),
  pendingComponent: () => (
    <SmartPageLoading
      message="Loading analytics..."
      holdDelay={1000}
      showSkeleton={true}
      skeletonLayout="detail"
    />
  ),
  loader: async ({ context: { queryClient } }) => {
    try {
      // Preload analytics data and related information
      const statsPromise = queryClient.ensureQueryData(statsQueries.overall());
      const runsPromise = queryClient.ensureQueryData(
        runQueries.withShoes(200),
      );
      const shoesPromise = queryClient.ensureQueryData(shoeQueries.list(true));

      // Wait for critical data
      await Promise.all([statsPromise, runsPromise, shoesPromise]);

      // Prefetch related data in background
      queryClient.prefetchQuery(collectionQueries.list()).catch(() => {});
      queryClient.prefetchQuery(runQueries.list(100)).catch(() => {});

      return {};
    } catch (error: any) {
      // If auth error, let the component handle it
      if (error?.message?.includes("Not authenticated")) {
        return {};
      }
      throw error;
    }
  },
});
