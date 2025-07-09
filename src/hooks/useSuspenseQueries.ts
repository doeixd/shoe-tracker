import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { shoeQueries, collectionQueries, runQueries, statsQueries } from "~/queries";

// Suspense-based hooks that eliminate loading states
// These hooks will suspend the component until data is available
// or throw an error that will be caught by error boundaries

export function useShoesSuspense(includeRetired = false) {
  return useSuspenseQuery({
    ...shoeQueries.list(includeRetired),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useCollectionsSuspense() {
  return useSuspenseQuery({
    ...collectionQueries.list(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useAppDataSuspense() {
  return useSuspenseQuery({
    ...convexQuery(api.dashboard.getAppData, {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useShoeSuspense(id: string) {
  return useSuspenseQuery({
    ...shoeQueries.detail(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useShoeWithStatsSuspense(id: string) {
  return useSuspenseQuery({
    ...shoeQueries.withStats(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useCollectionSuspense(id: string) {
  return useSuspenseQuery({
    ...collectionQueries.detail(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useRunSuspense(id: string) {
  return useSuspenseQuery({
    ...runQueries.detail(id),
    staleTime: 1000 * 60 * 2, // 2 minutes for runs
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useRunsSuspense(limit = 50, shoeId?: string) {
  return useSuspenseQuery({
    ...runQueries.list(limit, shoeId),
    staleTime: 1000 * 60 * 2, // 2 minutes for runs list
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useRunsWithShoesSuspense(limit = 50) {
  return useSuspenseQuery({
    ...runQueries.withShoes(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes for runs with shoes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useOverallStatsSuspense() {
  return useSuspenseQuery({
    ...statsQueries.overall(),
    staleTime: 1000 * 60 * 5, // 5 minutes for stats
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useDashboardStatsSuspense() {
  return useSuspenseQuery({
    ...convexQuery(api.dashboard.getDashboardStats, {}),
    staleTime: 1000 * 60 * 2, // 2 minutes for dashboard stats
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useShoesByCollectionSuspense(collectionId: string, includeRetired = false) {
  return useSuspenseQuery({
    ...shoeQueries.byCollection(collectionId, includeRetired),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useArchivedCollectionsSuspense() {
  return useSuspenseQuery({
    ...collectionQueries.archived(),
    staleTime: 1000 * 60 * 10, // 10 minutes for archived collections
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Utility function to create suspense queries with consistent error handling
export function createSuspenseQuery<T>(
  queryFn: () => any,
  options: {
    staleTime?: number;
    gcTime?: number;
  } = {}
) {
  return useSuspenseQuery({
    ...queryFn(),
    staleTime: options.staleTime || 1000 * 60 * 5, // Default 5 minutes
    gcTime: options.gcTime || 1000 * 60 * 15, // Default 15 minutes
  });
}

export function useHasUserDataSuspense() {
  return useSuspenseQuery({
    ...convexQuery(api.dashboard.hasUserData, {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}
