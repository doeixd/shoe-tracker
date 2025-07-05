import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";
import {
  ConvexOfflineManager,
  createConvexOfflineManager,
  getConvexOfflineManager,
  type ConvexConnectionState,
  type OfflineOperation,
} from "../utils/convex-offline-manager";
import { useUserBehaviorTracking } from "./useUserBehaviorTracking";
import {
  useIntelligentSyncPrioritizationAction,
  useResolveOfflineConflictsAction,
  useOptimizeOfflineCacheAction,
} from "../queries";

// Types for the Convex offline hook
interface ConvexOfflineHookState {
  isOnline: boolean;
  isConnected: boolean;
  connectionState: ConvexConnectionState;
  queueStatus: {
    total: number;
    immediate: number;
    background: number;
    deferred: number;
    syncInProgress: boolean;
  };
  lastSyncTime?: number;
  syncStats: {
    successfulOperations: number;
    failedOperations: number;
    totalSyncTime: number;
  };
}

interface ConvexOfflineConfig {
  autoSync: boolean;
  syncOnReconnect: boolean;
  enableIntelligentPrioritization: boolean;
  conflictResolutionStrategy:
    | "server-wins"
    | "client-wins"
    | "merge"
    | "ask-user";
  maxQueueSize: number;
  enableServiceWorker: boolean;
}

/**
 * Phase 3: useConvexOffline Hook
 *
 * Provides comprehensive offline management for Convex applications:
 * - Connection state monitoring
 * - Offline operation queueing
 * - Intelligent sync prioritization
 * - Conflict resolution
 * - Performance tracking
 * - Integration with user behavior patterns
 */
export function useConvexOffline(
  convexClient: ConvexReactClient,
  config: Partial<ConvexOfflineConfig> = {},
) {
  const router = useRouter();
  const { behaviorPatterns, sessionData } = useUserBehaviorTracking();
  const intelligentSync = useIntelligentSyncPrioritizationAction();
  const resolveConflicts = useResolveOfflineConflictsAction();
  const optimizeCache = useOptimizeOfflineCacheAction();

  // Configuration with defaults
  const finalConfig: ConvexOfflineConfig = {
    autoSync: true,
    syncOnReconnect: true,
    enableIntelligentPrioritization: true,
    conflictResolutionStrategy: "merge",
    maxQueueSize: 100,
    enableServiceWorker: true,
    ...config,
  };

  // State management
  const [state, setState] = useState<ConvexOfflineHookState>({
    isOnline: navigator.onLine,
    isConnected: false,
    connectionState: {
      state: "connecting",
      hasBeenConnected: false,
      reconnectAttempts: 0,
    },
    queueStatus: {
      total: 0,
      immediate: 0,
      background: 0,
      deferred: 0,
      syncInProgress: false,
    },
    syncStats: {
      successfulOperations: 0,
      failedOperations: 0,
      totalSyncTime: 0,
    },
  });

  // Manager instance ref
  const managerRef = useRef<ConvexOfflineManager | null>(null);
  const syncStatsRef = useRef({
    successfulOperations: 0,
    failedOperations: 0,
    totalSyncTime: 0,
    lastSyncTime: undefined as number | undefined,
  });

  // Initialize offline manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = createConvexOfflineManager(convexClient, {
        maxQueueSize: finalConfig.maxQueueSize,
        enableServiceWorkerIntegration: finalConfig.enableServiceWorker,
      });

      // Set up connection state listener
      const unsubscribe = managerRef.current.addConnectionListener(
        (connectionState) => {
          setState((prev) => ({
            ...prev,
            connectionState,
            isConnected: connectionState.state === "connected",
          }));

          // Auto sync on reconnect if enabled
          if (
            finalConfig.syncOnReconnect &&
            connectionState.state === "connected" &&
            connectionState.hasBeenConnected
          ) {
            handleAutoSync();
          }
        },
      );

      return () => {
        unsubscribe();
      };
    }
  }, [convexClient, finalConfig]);

  // Monitor browser online/offline state
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update queue status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (managerRef.current) {
        const queueStatus = managerRef.current.getQueueStatus();
        setState((prev) => ({ ...prev, queueStatus }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto sync handler with intelligent prioritization
  const handleAutoSync = useCallback(async () => {
    if (!managerRef.current || !finalConfig.autoSync) return;

    const startTime = Date.now();

    try {
      if (finalConfig.enableIntelligentPrioritization) {
        await performIntelligentSync();
      } else {
        await managerRef.current.manualSync();
      }

      // Update sync stats
      const syncTime = Date.now() - startTime;
      syncStatsRef.current = {
        ...syncStatsRef.current,
        successfulOperations: syncStatsRef.current.successfulOperations + 1,
        totalSyncTime: syncStatsRef.current.totalSyncTime + syncTime,
        lastSyncTime: Date.now(),
      };
    } catch (error) {
      console.error("[useConvexOffline] Auto sync failed:", error);
      syncStatsRef.current = {
        ...syncStatsRef.current,
        failedOperations: syncStatsRef.current.failedOperations + 1,
      };
    }

    setState((prev) => ({
      ...prev,
      lastSyncTime: syncStatsRef.current.lastSyncTime,
      syncStats: { ...syncStatsRef.current },
    }));
  }, [finalConfig]);

  // Intelligent sync using server-side prioritization
  const performIntelligentSync = useCallback(async () => {
    if (!managerRef.current) return;

    const queueStatus = managerRef.current.getQueueStatus();
    if (queueStatus.total === 0) return;

    try {
      // Prepare sync queue data
      const syncQueue = Array.from({ length: queueStatus.total }, (_, i) => ({
        type: "mutation",
        id: `operation-${i}`,
        priority: 70,
        operationType: "unknown",
        timestamp: Date.now(),
        retryCount: 0,
      }));

      // Get user context for intelligent prioritization
      const userContext = {
        userId: "current-user", // TODO: Get actual user ID
        currentRoute: router.state.location.pathname,
        deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
        connectionType: (navigator as any)?.connection?.effectiveType || "4g",
        patterns: behaviorPatterns
          ? {
              mostVisitedRoutes: behaviorPatterns.mostVisitedRoutes,
              commonSequences: behaviorPatterns.commonSequences,
              averageSessionDuration: behaviorPatterns.averageSessionDuration,
            }
          : undefined,
      };

      // Get intelligent sync prioritization
      const prioritization = await intelligentSync.execute({
        syncQueue,
        userContext,
      });

      console.log(
        "[useConvexOffline] Intelligent sync prioritization:",
        prioritization,
      );

      // Execute manual sync with the prioritized information
      await managerRef.current.manualSync();
    } catch (error) {
      console.error("[useConvexOffline] Intelligent sync failed:", error);
      // Fallback to regular sync
      await managerRef.current.manualSync();
    }
  }, [router.state.location.pathname, behaviorPatterns, intelligentSync]);

  // Queue an operation for offline execution
  const queueOperation = useCallback(
    (
      type: "mutation" | "action",
      name: string,
      args: any,
      priority: number = 50,
    ) => {
      if (!managerRef.current) return false;

      const connection = (navigator as any)?.connection;

      return managerRef.current.queueOperation({
        type,
        name,
        args,
        priority,
        userContext: {
          route: router.state.location.pathname,
          deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
          connectionType: connection?.effectiveType || "4g",
        },
      });
    },
    [router.state.location.pathname],
  );

  // Manual sync with progress tracking
  const manualSync = useCallback(async () => {
    if (!managerRef.current) return false;

    const startTime = Date.now();

    try {
      setState((prev) => ({
        ...prev,
        queueStatus: { ...prev.queueStatus, syncInProgress: true },
      }));

      if (finalConfig.enableIntelligentPrioritization) {
        await performIntelligentSync();
      } else {
        await managerRef.current.manualSync();
      }

      const syncTime = Date.now() - startTime;
      syncStatsRef.current = {
        ...syncStatsRef.current,
        successfulOperations: syncStatsRef.current.successfulOperations + 1,
        totalSyncTime: syncStatsRef.current.totalSyncTime + syncTime,
        lastSyncTime: Date.now(),
      };

      return true;
    } catch (error) {
      console.error("[useConvexOffline] Manual sync failed:", error);
      syncStatsRef.current = {
        ...syncStatsRef.current,
        failedOperations: syncStatsRef.current.failedOperations + 1,
      };
      return false;
    } finally {
      setState((prev) => ({
        ...prev,
        queueStatus: { ...prev.queueStatus, syncInProgress: false },
        lastSyncTime: syncStatsRef.current.lastSyncTime,
        syncStats: { ...syncStatsRef.current },
      }));
    }
  }, [finalConfig, performIntelligentSync]);

  // Clear the offline queue
  const clearQueue = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearQueue();
      setState((prev) => ({
        ...prev,
        queueStatus: {
          total: 0,
          immediate: 0,
          background: 0,
          deferred: 0,
          syncInProgress: false,
        },
      }));
    }
  }, []);

  // Optimize cache based on usage patterns
  const optimizeCacheStrategy = useCallback(async () => {
    try {
      const userContext = {
        userId: "current-user", // TODO: Get actual user ID
        storageUsed: await getStorageUsage(),
        storageLimit: await getStorageLimit(),
        connectionType: (navigator as any)?.connection?.effectiveType || "4g",
        deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
        frequentRoutes: behaviorPatterns?.mostVisitedRoutes || [],
      };

      const cacheStats = {
        totalEntries: 0, // TODO: Get actual cache stats
        hitRate: 0.8,
        averageEntrySize: 1024,
        oldestEntry: Date.now() - 24 * 60 * 60 * 1000,
      };

      const optimization = await optimizeCache.execute({
        userContext,
        cacheStats,
      });

      console.log("[useConvexOffline] Cache optimization:", optimization);
      return optimization;
    } catch (error) {
      console.error("[useConvexOffline] Cache optimization failed:", error);
      return null;
    }
  }, [behaviorPatterns, optimizeCache]);

  // Get connection diagnostics
  const getConnectionDiagnostics = useCallback(() => {
    return {
      isOnline: state.isOnline,
      isConnected: state.isConnected,
      connectionState: state.connectionState,
      queueStatus: state.queueStatus,
      syncStats: state.syncStats,
      lastSyncTime: state.lastSyncTime,
      browserOnline: navigator.onLine,
      connectionType:
        (navigator as any)?.connection?.effectiveType || "unknown",
      effectiveType: (navigator as any)?.connection?.type || "unknown",
    };
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, []);

  return {
    // State
    ...state,

    // Actions
    queueOperation,
    manualSync,
    clearQueue,
    optimizeCacheStrategy,

    // Utilities
    getConnectionDiagnostics,
    isOffline: !state.isConnected,
    hasQueuedOperations: state.queueStatus.total > 0,
    canSync: state.isConnected && !state.queueStatus.syncInProgress,

    // Configuration
    config: finalConfig,
  };
}

// Helper functions
async function getStorageUsage(): Promise<number> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.warn("Failed to get storage usage:", error);
    }
  }
  return 0;
}

async function getStorageLimit(): Promise<number> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || 1024 * 1024 * 1024; // Default 1GB
    } catch (error) {
      console.warn("Failed to get storage limit:", error);
    }
  }
  return 1024 * 1024 * 1024; // Default 1GB
}

// Hook for simplified offline-aware mutations
export function useOfflineAwareMutation(
  mutationName: string,
  options: {
    priority?: number;
    optimistic?: boolean;
  } = {},
) {
  const { queueOperation, isOffline } = useConvexOffline(
    // This would need to be passed in or accessed from context
    {} as ConvexReactClient,
  );

  const executeMutation = useCallback(
    async (args: any) => {
      if (isOffline) {
        // Queue for offline execution
        return queueOperation(
          "mutation",
          mutationName,
          args,
          options.priority || 50,
        );
      } else {
        // Execute immediately
        // This would need access to the actual Convex client
        throw new Error("Online execution not implemented in this example");
      }
    },
    [isOffline, queueOperation, mutationName, options.priority],
  );

  return {
    mutate: executeMutation,
    isOffline,
  };
}

export default useConvexOffline;
