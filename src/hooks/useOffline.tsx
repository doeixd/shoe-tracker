import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { offlineDB } from "~/services/offline/offlineDB";
import { syncService, SyncState } from "~/services/offline/syncService";
import type { Collection, Shoe, Run } from "~/types";

// Offline context types
export interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
  syncState: SyncState;
  offlineStats: {
    collectionsCount: number;
    shoesCount: number;
    runsCount: number;
    pendingSyncItems: number;
    cacheSize: number;
    lastSync: number | null;
  };
}

interface OfflineContextType {
  state: OfflineState;
  actions: {
    forceSyncNow: () => Promise<void>;
    resolveConflict: (conflictId: string, useLocal: boolean) => Promise<void>;
    clearSyncErrors: () => Promise<void>;
    enableOfflineMode: () => Promise<void>;
    disableOfflineMode: () => Promise<void>;
  };
  offlineQueries: {
    getCollections: () => Promise<Collection[]>;
    getShoes: (includeRetired?: boolean) => Promise<Shoe[]>;
    getRuns: (limit?: number, shoeId?: string) => Promise<Run[]>;
    getCollection: (id: string) => Promise<Collection | null>;
    getShoe: (id: string) => Promise<Shoe | null>;
    getRun: (id: string) => Promise<Run | null>;
  };
  offlineMutations: {
    saveCollection: (collection: Collection) => Promise<void>;
    saveShoe: (shoe: Shoe) => Promise<void>;
    saveRun: (run: Run) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;
    deleteShoe: (id: string) => Promise<void>;
    deleteRun: (id: string) => Promise<void>;
  };
}

// Create context
const OfflineContext = createContext<OfflineContextType | null>(null);

// Provider component
interface OfflineProviderProps {
  children: ReactNode;
  convexClient?: any; // ConvexReactClient
}

export function OfflineProvider({
  children,
  convexClient,
}: OfflineProviderProps) {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isInitialized: false,
    syncState: {
      status: "idle",
      lastSync: null,
      pendingOperations: 0,
      errors: [],
      conflicts: [],
    },
    offlineStats: {
      collectionsCount: 0,
      shoesCount: 0,
      runsCount: 0,
      pendingSyncItems: 0,
      cacheSize: 0,
      lastSync: null,
    },
  });

  // Initialize offline functionality
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Initialize offline database
        await offlineDB.initialize();

        // Initialize sync service if Convex client is available
        if (convexClient) {
          syncService.initialize(convexClient);
        }

        // Load initial offline stats
        const stats = await offlineDB.getOfflineStats();

        if (mounted) {
          setState((prev) => ({
            ...prev,
            isInitialized: true,
            offlineStats: stats,
          }));
        }
      } catch (error) {
        console.error("Failed to initialize offline functionality:", error);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [convexClient]);

  // Listen for online/offline events
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

  // Listen for sync state changes
  useEffect(() => {
    const unsubscribe = syncService.addSyncListener((syncState) => {
      setState((prev) => ({
        ...prev,
        syncState,
      }));
    });

    return unsubscribe;
  }, []);

  // Update offline stats periodically
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await offlineDB.getOfflineStats();
        setState((prev) => ({
          ...prev,
          offlineStats: stats,
        }));
      } catch (error) {
        console.error("Failed to update offline stats:", error);
      }
    };

    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Actions
  const actions = {
    forceSyncNow: async () => {
      await syncService.forceSyncNow();
    },

    resolveConflict: async (conflictId: string, useLocal: boolean) => {
      await syncService.resolveConflictManually(conflictId, useLocal);
    },

    clearSyncErrors: async () => {
      await syncService.clearSyncErrors();
    },

    enableOfflineMode: async () => {
      console.log("Offline mode enabled");
    },

    disableOfflineMode: async () => {
      console.log("Offline mode disabled");
    },
  };

  // Offline queries
  const offlineQueries = {
    getCollections: () => offlineDB.getCollections(),
    getShoes: (includeRetired = false) => offlineDB.getShoes(includeRetired),
    getRuns: (limit = 50, shoeId?: string) => offlineDB.getRuns(limit, shoeId),
    getCollection: (id: string) => offlineDB.getCollection(id),
    getShoe: (id: string) => offlineDB.getShoe(id),
    getRun: (id: string) => offlineDB.getRun(id),
  };

  // Offline mutations
  const offlineMutations = {
    saveCollection: async (collection: Collection) => {
      await offlineDB.saveCollection(collection, !state.isOnline);
    },
    saveShoe: async (shoe: Shoe) => {
      await offlineDB.saveShoe(shoe, !state.isOnline);
    },
    saveRun: async (run: Run) => {
      await offlineDB.saveRun(run, !state.isOnline);
    },
    deleteCollection: async (id: string) => {
      await offlineDB.deleteCollection(id, !state.isOnline);
    },
    deleteShoe: async (id: string) => {
      await offlineDB.deleteShoe(id, !state.isOnline);
    },
    deleteRun: async (id: string) => {
      await offlineDB.deleteRun(id, !state.isOnline);
    },
  };

  const contextValue: OfflineContextType = {
    state,
    actions,
    offlineQueries,
    offlineMutations,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}

// Hook to use offline context
export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}

// Individual hooks for specific functionality
export function useOnlineStatus() {
  const { state } = useOffline();
  return {
    isOnline: state.isOnline,
    isOffline: !state.isOnline,
  };
}

export function useSyncStatus() {
  const { state, actions } = useOffline();
  return {
    syncState: state.syncState,
    forceSyncNow: actions.forceSyncNow,
    clearSyncErrors: actions.clearSyncErrors,
    issyncing: state.syncState.status === "syncing",
    hasErrors: state.syncState.errors.length > 0,
    hasConflicts:
      state.syncState.conflicts.filter((c) => !c.resolved).length > 0,
    pendingOperations: state.syncState.pendingOperations,
  };
}

export function useOfflineStats() {
  const { state } = useOffline();
  return state.offlineStats;
}

// Hook for conflict resolution UI
export function useConflictResolution() {
  const { state, actions } = useOffline();

  const unresolvedConflicts = state.syncState.conflicts.filter(
    (c) => !c.resolved,
  );

  const resolveConflict = async (
    conflictId: string,
    resolution: "local" | "remote",
  ) => {
    await actions.resolveConflict(conflictId, resolution === "local");
  };

  return {
    conflicts: unresolvedConflicts,
    hasConflicts: unresolvedConflicts.length > 0,
    resolveConflict,
  };
}

// Hook for PWA installation
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    const accepted = result.outcome === "accepted";

    if (accepted) {
      setIsInstallable(false);
      setInstallPrompt(null);
    }

    return accepted;
  };

  return {
    isInstallable,
    isInstalled,
    install,
  };
}

// Hook for service worker updates
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setRegistration(reg);

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_REQUESTED") {
          // Trigger sync when requested by service worker
          syncService.forceSyncNow();
        }
      });
    }
  }, []);

  const applyUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  return {
    updateAvailable,
    applyUpdate,
  };
}

export default OfflineProvider;
