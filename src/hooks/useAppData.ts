import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

/**
 * Simple hook to access all app data using Convex's built-in caching
 * This replaces the complex SWR implementation with Convex's native features
 */
export function useAppData() {
  const query = useQuery({
    ...convexQuery(api.dashboard.getAppData, {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    // Raw query state
    ...query,

    // Convenient data accessors with fallbacks
    collections: query.data?.collections || [],
    archivedCollections: query.data?.archivedCollections || [],
    shoes: query.data?.shoes || [],
    runs: query.data?.runs || [],
    allRuns: query.data?.allRuns || [],
    stats: query.data?.stats,
    shoesNeedingReplacement: query.data?.shoesNeedingReplacement || [],

    // Helper methods
    getShoeById: (id: string) =>
      query.data?.shoes.find(shoe => shoe.id === id),

    getCollectionById: (id: string) =>
      query.data?.collections.find(collection => collection.id === id),

    getRunById: (id: string) =>
      query.data?.allRuns?.find(run => run.id === id),

    getShoesByCollection: (collectionId: string, includeRetired = false) => {
      const shoes = query.data?.shoes || [];
      const filtered = shoes.filter(shoe => shoe.collectionId === collectionId);
      return includeRetired ? filtered : filtered.filter(shoe => !shoe.isRetired);
    },

    getRunsByShoe: (shoeId: string) =>
      query.data?.allRuns?.filter(run => run.shoeId === shoeId) || [],
  };
}

/**
 * Hook specifically for checking if user has any data (onboarding flow)
 */
export function useHasUserData() {
  return useQuery({
    ...convexQuery(api.dashboard.hasUserData, {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Lightweight hook for just dashboard stats
 */
export function useDashboardStats() {
  return useQuery({
    ...convexQuery(api.dashboard.getDashboardStats, {}),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
