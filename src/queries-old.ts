import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import type {
  Collection,
  Shoe,
  Run,
  ShoeWithStats,
  RunWithShoe,
  OverallStats,
} from "./types";

// Error handling wrapper for queries
const withAuthErrorHandling = <T = any>(
  queryFn: T,
): T & {
  retry: (failureCount: number, error: any) => boolean;
  onError: (error: any) => void;
  enabled?: boolean;
} => ({
  ...queryFn,
  retry: (failureCount: number, error: any) => {
    // Don't retry on auth errors
    if (
      error?.message?.includes("not authenticated") ||
      error?.message?.includes("access denied") ||
      error?.message?.includes("Unauthorized")
    ) {
      return false;
    }
    return failureCount < 2;
  },
  onError: (error: any) => {
    // Only show auth errors if they're not from preloading
    if (error?.message?.includes("not authenticated")) {
      // Don't show toast for preloading auth errors
      if (!error?.message?.includes("preload")) {
        console.debug("Auth error (likely from preloading):", error);
      }
    } else if (error?.message?.includes("access denied")) {
      toast.error("Access denied");
    } else if (!error?.message?.includes("Loading")) {
      console.error("Query error:", error);
    }
  },
  // Add enabled property for conditional querying
  enabled: true,
});

// Collection queries
export const collectionQueries = {
  list: () => withAuthErrorHandling(convexQuery(api.shoes.getCollections, {})),
  archived: () =>
    withAuthErrorHandling(convexQuery(api.shoes.getArchivedCollections, {})),
  detail: (id: string) =>
    withAuthErrorHandling(convexQuery(api.shoes.getCollection, { id })),
};

// Typed collection hooks
export function useCollections() {
  return useQuery({
    ...collectionQueries.list(),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Collection[]; error: any; isLoading: boolean };
}

export function useCollection(id: string) {
  return useQuery({
    ...collectionQueries.detail(id),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Collection; error: any; isLoading: boolean };
}

// Shoe queries
export const shoeQueries = {
  list: (includeRetired = false) =>
    withAuthErrorHandling(convexQuery(api.shoes.getShoes, { includeRetired })),
  byCollection: (collectionId: string, includeRetired = false) =>
    withAuthErrorHandling(
      convexQuery(api.shoes.getShoesByCollection, {
        collectionId,
        includeRetired,
      }),
    ),
  detail: (id: string) =>
    withAuthErrorHandling(convexQuery(api.shoes.getShoe, { id })),
  withStats: (id: string) =>
    withAuthErrorHandling(convexQuery(api.shoes.getShoeWithStats, { id })),
};

// Typed shoe hooks
export function useShoes(includeRetired = false) {
  return useQuery({
    ...shoeQueries.list(includeRetired),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Shoe[]; error: any; isLoading: boolean };
}

export function useShoe(id: string) {
  return useQuery({
    ...shoeQueries.detail(id),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Shoe; error: any; isLoading: boolean };
}

export function useShoeWithStats(id: string) {
  return useQuery({
    ...shoeQueries.withStats(id),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: ShoeWithStats; error: any; isLoading: boolean };
}

export function useShoesByCollection(
  collectionId: string,
  includeRetired = false,
) {
  return useQuery({
    ...shoeQueries.byCollection(collectionId, includeRetired),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Shoe[]; error: any; isLoading: boolean };
}

// Run queries
export const runQueries = {
  list: (limit = 50, shoeId?: string) =>
    withAuthErrorHandling(convexQuery(api.shoes.getRuns, { limit, shoeId })),
  detail: (id: string) =>
    withAuthErrorHandling(convexQuery(api.shoes.getRun, { id })),
  withShoes: (limit = 50) =>
    withAuthErrorHandling(convexQuery(api.shoes.getRunsWithShoes, { limit })),
};

// Typed run hooks
export function useRuns(limit = 50, shoeId?: string) {
  return useQuery({
    ...runQueries.list(limit, shoeId),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Run[]; error: any; isLoading: boolean };
}

export function useRun(id: string) {
  return useQuery({
    ...runQueries.detail(id),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: Run; error: any; isLoading: boolean };
}

export function useRunsWithShoes(limit = 50) {
  return useQuery({
    ...runQueries.withShoes(limit),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: RunWithShoe[]; error: any; isLoading: boolean };
}

// Stats queries
export const statsQueries = {
  overall: () =>
    withAuthErrorHandling(convexQuery(api.shoes.getOverallStats, {})),
};

// Typed stats hooks
export function useOverallStats() {
  return useQuery({
    ...statsQueries.overall(),
    retry: (failureCount: number, error: any) => {
      if (error?.message?.includes("not authenticated")) {
        return false;
      }
      return failureCount < 2;
    },
  }) as { data: OverallStats; error: any; isLoading: boolean };
}

// Mutation error handler
const handleMutationError = (error: any, navigate?: any) => {
  if (error?.message?.includes("not authenticated")) {
    toast.error("Session expired. Please sign in again.");
    if (navigate) {
      navigate({ to: "/auth/signin" });
    }
  } else if (error?.message?.includes("access denied")) {
    toast.error("Access denied");
  } else {
    console.error("Mutation error:", error);
    toast.error(error?.message || "An error occurred");
  }
};

// Collection mutations
export function useCreateCollectionMutation() {
  const mutationFn = useConvexMutation(api.shoes.createCollection);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useUpdateCollectionMutation() {
  const mutationFn = useConvexMutation(api.shoes.updateCollection);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useDeleteCollectionMutation() {
  const mutationFn = useConvexMutation(api.shoes.deleteCollection);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useArchiveCollectionMutation() {
  const mutationFn = useConvexMutation(api.shoes.archiveCollection);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

// Shoe mutations
export function useCreateShoeMutation() {
  const mutationFn = useConvexMutation(api.shoes.createShoe);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useUpdateShoeMutation() {
  const mutationFn = useConvexMutation(api.shoes.updateShoe);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useDeleteShoeMutation() {
  const mutationFn = useConvexMutation(api.shoes.deleteShoe);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useRetireShoeMutation() {
  const mutationFn = useConvexMutation(api.shoes.retireShoe);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

// Run mutations
export function useCreateRunMutation() {
  const mutationFn = useConvexMutation(api.shoes.createRun);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useUpdateRunMutation() {
  const mutationFn = useConvexMutation(api.shoes.updateRun);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useDeleteRunMutation() {
  const mutationFn = useConvexMutation(api.shoes.deleteRun);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

// Image upload mutations
export function useGenerateUploadUrlMutation() {
  const mutationFn = useConvexMutation(api.shoes.generateUploadUrl);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

export function useUpdateShoeImageMutation() {
  const mutationFn = useConvexMutation(api.shoes.updateShoeImage);
  return useMutation({
    mutationFn,
    onError: handleMutationError,
  });
}

// Auth-aware hook for checking if queries should be enabled
export function useAuthQuery() {
  const navigate = useNavigate();

  return {
    handleAuthError: (error: any) => handleMutationError(error, navigate),
    isEnabled: true, // Could be enhanced to check auth status
  };
}
