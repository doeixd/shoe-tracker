import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./AuthProvider";

interface AppDataLoaderProps {
  children: React.ReactNode;
}

/**
 * Simple component that prefetches app data when user is authenticated
 * Leverages Convex's built-in caching for instant subsequent loads
 */
export function AppDataLoader({ children }: AppDataLoaderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Prefetch app data for instant loading
      queryClient.prefetchQuery({
        ...convexQuery(api.dashboard.getAppData, {}),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });

      // Also prefetch user data check for onboarding
      queryClient.prefetchQuery({
        ...convexQuery(api.dashboard.hasUserData, {}),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }
  }, [isAuthenticated, authLoading, queryClient]);

  return <>{children}</>;
}
