import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { collectionQueries, shoeQueries } from "~/queries";
import { useAuth } from "~/components/AuthProvider";
import { useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";

// TypeScript interfaces for PWA debug data
interface ServiceWorkerStatus {
  supported: boolean;
  status: string;
  scope?: string;
  updateTime?: string;
  installing?: boolean;
  waiting?: boolean;
  active?: boolean;
}

interface InstallabilityStatus {
  canInstall: boolean;
  isInstalled: boolean;
  userAgent?: string;
  platform?: string;
}

interface ManifestStatus {
  available: boolean;
  manifest: any;
  error: string | null;
}

interface CacheAPIStatus {
  supported: boolean;
  caches: string[];
  totalCaches: number;
}

interface NotificationStatus {
  supported: boolean;
  permission: string;
  canRequest?: boolean;
}

interface BackgroundSyncStatus {
  supported: boolean;
  backgroundFetch: boolean;
}

interface StorageQuotaStatus {
  supported: boolean;
  quota?: number;
  usage?: number;
  usagePercentage?: number | string;
}

interface PWAStatus {
  serviceWorker: ServiceWorkerStatus;
  installability: InstallabilityStatus;
  manifest: ManifestStatus;
  cacheAPI: CacheAPIStatus;
  notifications: NotificationStatus;
  backgroundSync: BackgroundSyncStatus;
  storageQuota: StorageQuotaStatus;
}

// PWA Debug utilities
const checkServiceWorkerStatus = (): Promise<ServiceWorkerStatus> => {
  if (!("serviceWorker" in navigator)) {
    return Promise.resolve({ supported: false, status: "not-supported" });
  }

  return navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (registration) {
        return {
          supported: true,
          status: "registered",
          scope: registration.scope,
          updateTime: registration.updateViaCache,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          active: !!registration.active,
        };
      }
      return { supported: true, status: "not-registered" };
    })
    .catch(() => ({ supported: true, status: "error" }));
};

const checkPWAInstallability = (): InstallabilityStatus => {
  return {
    canInstall: "onbeforeinstallprompt" in window,
    isInstalled:
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as any).standalone === true,
    userAgent: navigator.userAgent,
    platform: (navigator as any).platform || "unknown",
  };
};

const checkManifest = async (): Promise<ManifestStatus> => {
  try {
    const response = await fetch("/manifest.json");
    if (!response.ok) throw new Error("Manifest not found");
    const manifest = await response.json();
    return { available: true, manifest, error: null };
  } catch (error) {
    return {
      available: false,
      manifest: null,
      error: (error as Error).message,
    };
  }
};

const checkCacheAPI = (): Promise<CacheAPIStatus> => {
  if (!("caches" in window)) {
    return Promise.resolve({ supported: false, caches: [], totalCaches: 0 });
  }

  return caches.keys().then((cacheNames) => ({
    supported: true,
    caches: cacheNames,
    totalCaches: cacheNames.length,
  }));
};

const checkNotificationPermission = () => {
  if (!("Notification" in window)) {
    return { supported: false, permission: "not-supported" };
  }

  return {
    supported: true,
    permission: Notification.permission,
    canRequest: Notification.permission === "default",
  };
};

const checkBackgroundSync = () => {
  return {
    supported:
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype,
    backgroundFetch:
      "serviceWorker" in navigator &&
      "backgroundFetch" in window.ServiceWorkerRegistration.prototype,
  };
};

const checkStorageQuota = async () => {
  if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
    return { supported: false };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      supported: true,
      quota: estimate.quota,
      usage: estimate.usage,
      usagePercentage: estimate.quota
        ? (((estimate.usage || 0) / estimate.quota) * 100).toFixed(2)
        : 0,
    };
  } catch (error) {
    return { supported: true, error: (error as Error).message };
  }
};

function DebugPageWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Sign in required
            </h2>
            <p className="mt-2 text-gray-600">
              Please sign in to access debug information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <DebugPage />;
}

export const Route = createFileRoute("/debug")({
  component: DebugPageWrapper,
});

function DebugPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // PWA state
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    serviceWorker: { supported: false, status: "checking" },
    installability: { canInstall: false, isInstalled: false },
    manifest: { available: false, manifest: null, error: null },
    cacheAPI: { supported: false, caches: [], totalCaches: 0 },
    notifications: { supported: false, permission: "default" },
    backgroundSync: { supported: false, backgroundFetch: false },
    storageQuota: { supported: false },
  });

  const collectionsQuery = useSuspenseQuery(collectionQueries.list());
  const shoesQuery = useSuspenseQuery(shoeQueries.list());

  // Test queries
  const testDataQuery = useSuspenseQuery(
    convexQuery(api.shoes.testDataAvailability, {}),
  );
  const testAuthQuery = useSuspenseQuery(
    convexQuery(api.shoes.testUserAuth, {}),
  );
  const testUserDataQuery = useSuspenseQuery(
    convexQuery(api.shoes.testUserData, {}),
  );

  // Manual setup mutation
  const setupUserDataMutation = useConvexMutation(api.auth.setupUserData);

  // Force assign mutation
  const forceAssignMutation = useConvexMutation(api.auth.forceAssignAllData);

  // Test mutations for debugging
  const createCollectionMutation = useConvexMutation(
    api.shoes.createCollection,
  );
  const createShoeMutation = useConvexMutation(api.shoes.createShoe);
  const createRunMutation = useConvexMutation(api.shoes.createRun);

  // Debug mutations for testing
  const testInsertMutationFn = useConvexMutation(api.debug.testInsert);
  const testBasicInsertMutationFn = useConvexMutation(
    api.debug.testBasicInsert,
  );
  const clearTestDataMutationFn = useConvexMutation(api.debug.clearTestData);

  // Add state to track pending status
  const [testInsertPending, setTestInsertPending] = useState(false);
  const [testBasicInsertPending, setTestBasicInsertPending] = useState(false);
  const [clearTestDataPending, setClearTestDataPending] = useState(false);

  // Debug queries
  const testConnectionQuery = useSuspenseQuery(
    convexQuery(api.debug.testConnection, {}),
  );
  const allTestDocsQuery = useSuspenseQuery(
    convexQuery(api.debug.getAllTestDocuments, {}),
  );

  // Quick setup mutation
  const [isCreatingInitialData, setIsCreatingInitialData] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  // Service Worker Event Listeners
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        addLog(`Message from Service Worker: ${JSON.stringify(event.data)}`);
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        addLog("Service Worker controller changed");
      });

      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          addLog(
            `Service Worker already registered with scope: ${registration.scope}`,
          );

          registration.addEventListener("updatefound", () => {
            addLog("Service Worker update found");
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                addLog(`Service Worker state changed to: ${newWorker.state}`);
              });
            }
          });
        } else {
          addLog(
            "No Service Worker registration found - PWA plugin will handle registration",
          );
        }
      });
    } else {
      addLog("Service Worker not supported in this browser");
    }
  }, []);

  // PWA Install Prompt Detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      addLog("PWA install prompt detected and stored");
    };

    const handleAppInstalled = () => {
      addLog("PWA was installed successfully");
      (window as any).deferredPrompt = null;
      setPwaStatus((prev) => ({
        ...prev,
        installability: { ...prev.installability, isInstalled: true },
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    addLog(
      `Auth status: ${isAuthenticated ? "authenticated" : "not authenticated"}`,
    );
    addLog(`User ID: ${user?.id || "none"}`);
    addLog(
      `Convex URL: ${(import.meta as any).env.VITE_CONVEX_URL || "NOT SET"}`,
    );

    // Test connection to Convex
    if (isAuthenticated) {
      testDataQuery
        .refetch()
        .then(() => {
          setConnectionStatus("connected");
          addLog("Convex connection successful");
        })
        .catch((error) => {
          setConnectionStatus("error");
          addLog(`Convex connection failed: ${error.message}`);
        });
    }

    // Check PWA status
    const checkPWAStatus = async () => {
      addLog("Checking PWA status...");

      try {
        // Service Worker
        const swStatus = await checkServiceWorkerStatus();
        addLog(`Service Worker: ${swStatus.status}`);

        // Installability
        const installStatus = checkPWAInstallability();
        addLog(`PWA Installed: ${installStatus.isInstalled}`);

        // Manifest
        const manifestStatus = await checkManifest();
        addLog(
          `Manifest: ${manifestStatus.available ? "available" : "not available"}`,
        );

        // Cache API
        const cacheStatus = await checkCacheAPI();
        addLog(
          `Cache API: ${cacheStatus.supported ? `${cacheStatus.totalCaches} caches` : "not supported"}`,
        );

        // Notifications
        const notificationStatus = checkNotificationPermission();
        addLog(`Notifications: ${notificationStatus.permission}`);

        // Background Sync
        const bgSyncStatus = checkBackgroundSync();
        addLog(
          `Background Sync: ${bgSyncStatus.supported ? "supported" : "not supported"}`,
        );

        // Storage Quota
        const storageStatus = await checkStorageQuota();
        addLog(
          `Storage Quota: ${storageStatus.supported ? "supported" : "not supported"}`,
        );

        setPwaStatus({
          serviceWorker: swStatus,
          installability: installStatus,
          manifest: manifestStatus,
          cacheAPI: cacheStatus,
          notifications: notificationStatus,
          backgroundSync: bgSyncStatus,
          storageQuota: storageStatus,
        });

        addLog("PWA status check completed");
      } catch (error) {
        addLog(`PWA status check failed: ${(error as Error).message}`);
      }
    };

    checkPWAStatus();
  }, [isAuthenticated, user]);

  const debugInfo = {
    collections: collectionsQuery.data,
    shoes: shoesQuery.data,
    activeShoes: shoesQuery.data.filter((shoe) => !shoe.isRetired),
    collectionsCount: collectionsQuery.data?.length || 0,
    shoesCount: shoesQuery.data?.length || 0,
    activeShoesCount:
      shoesQuery.data.filter((shoe) => !shoe.isRetired).length || 0,
    testData: testDataQuery.data,
    testAuth: testAuthQuery.data,
    testUserData: testUserDataQuery.data,
    connectionStatus,
    authStatus: { isAuthenticated, isLoading, user },
  };

  const handleManualSetup = async () => {
    try {
      const result = await setupUserDataMutation({});
      if (result.assigned) {
        toast.success(
          `Setup complete! Assigned ${result.collectionsCount} collections and ${result.shoesCount} shoes.`,
        );
      } else {
        toast.info("User data already set up!");
      }
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast.error(`Setup failed: ${error.message}`);
    }
  };

  const handleForceAssign = async () => {
    try {
      const result = await forceAssignMutation({});
      toast.success(
        `Force assigned ${result.totalAssigned} items (${result.collectionsAssigned} collections, ${result.shoesAssigned} shoes, ${result.runsAssigned} runs)`,
      );
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast.error(`Force assign failed: ${error.message}`);
    }
  };

  const handleQuickSetup = async () => {
    setIsCreatingInitialData(true);
    addLog("Starting quick setup with initial data...");

    try {
      // Create collections first
      const collections = [
        {
          name: "Road Running",
          description: "Daily training and long run shoes for pavement",
          color: "#3b82f6",
        },
        {
          name: "Trail Running",
          description: "Off-road and hiking shoes for trails",
          color: "#10b981",
        },
        {
          name: "Racing",
          description: "Lightweight racing flats and competition shoes",
          color: "#ef4444",
        },
      ];

      const collectionIds = [];
      for (const collection of collections) {
        addLog(`Creating collection: ${collection.name}`);
        const id = await createCollectionMutation(collection);
        collectionIds.push(id);
        addLog(`Collection created with ID: ${id}`);
      }

      // Create some sample shoes
      const shoes = [
        {
          name: "Daily Trainer",
          model: "Ghost 15",
          brand: "Brooks",
          collectionId: collectionIds[0], // Road Running
          maxMileage: 500,
          purchasePrice: 140,
          size: "10.5",
          notes: "Great for daily miles, very comfortable",
        },
        {
          name: "Trail Beast",
          model: "Speedgoat 5",
          brand: "HOKA",
          collectionId: collectionIds[1], // Trail Running
          maxMileage: 400,
          purchasePrice: 155,
          size: "10.5",
          notes: "Perfect for technical trails",
        },
      ];

      for (const shoe of shoes) {
        addLog(`Creating shoe: ${shoe.name}`);
        const id = await createShoeMutation(shoe);
        addLog(`Shoe created with ID: ${id}`);
      }

      toast.success(
        "Quick setup completed! Created 3 collections and 2 shoes.",
      );
      addLog("Quick setup completed successfully!");

      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      addLog(`Quick setup failed: ${error.message}`);
      toast.error(`Quick setup failed: ${error.message}`);
    } finally {
      setIsCreatingInitialData(false);
    }
  };

  const handleTestBasicConnection = async () => {
    addLog("Testing basic connection (no auth required)...");
    setTestBasicInsertPending(true);

    try {
      const result = await testBasicInsertMutationFn({
        message: "Basic connectivity test",
      });

      addLog(`Basic test successful! Doc ID: ${result.docId}`);
      toast.success("Basic connection test passed!");

      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      addLog(`Basic test failed: ${error.message}`);
      toast.error(`Basic test failed: ${error.message}`);
    } finally {
      setTestBasicInsertPending(false);
    }
  };

  const handleTestAuthenticatedInsert = async () => {
    addLog("Testing authenticated insert...");
    setTestInsertPending(true);

    try {
      const result = await testInsertMutationFn({
        message: "Authenticated test",
        timestamp: Date.now(),
      });

      addLog(`Authenticated test successful!`);
      addLog(`Doc ID: ${result.docId}, User ID: ${result.userId}`);
      toast.success("Authenticated test passed!");

      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      addLog(`Authenticated test failed: ${error.message}`);
      toast.error(`Authenticated test failed: ${error.message}`);
    } finally {
      setTestInsertPending(false);
    }
  };

  const handleClearTestData = async () => {
    addLog("Clearing test data...");
    setClearTestDataPending(true);

    try {
      const result = await clearTestDataMutationFn({});

      addLog(`Cleared ${result.deletedCount} test documents`);
      toast.success(`Cleared ${result.deletedCount} test documents`);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      addLog(`Clear failed: ${error.message}`);
      toast.error(`Clear failed: ${error.message}`);
    } finally {
      setClearTestDataPending(false);
    }
  };

  const handleTestCreateCollection = async () => {
    addLog("Starting collection creation test...");
    addLog(`Auth status before mutation: ${isAuthenticated}`);
    addLog(`User ID: ${user?.id}`);

    try {
      const mutationData = {
        name: "Debug Test Collection",
        description: "A collection created for debugging purposes",
        color: "#3b82f6",
      };

      addLog(`Mutation data: ${JSON.stringify(mutationData)}`);

      const collectionId = await createCollectionMutation(mutationData);

      addLog(`Collection created successfully with ID: ${collectionId}`);
      toast.success(`Collection created successfully! ID: ${collectionId}`);

      // Refresh the page to see updated data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      addLog(`Collection creation failed: ${error.message}`);
      addLog(`Error details: ${JSON.stringify(error)}`);
      console.error("Full error object:", error);
      toast.error(`Collection creation failed: ${error.message}`);
    }
  };

  const handleTestCreateShoe = async () => {
    if (!debugInfo.collections.length) {
      toast.error("Create a collection first!");
      return;
    }

    try {
      console.log("Testing shoe creation...");
      const shoeId = await createShoeMutation({
        name: "Debug Test Shoe",
        model: "Test Runner v1",
        brand: "Debug Brand",
        collectionId: debugInfo.collections[0].id,
        maxMileage: 300,
        purchasePrice: 120,
        size: "10.5",
      });
      console.log("Shoe created with ID:", shoeId);
      toast.success(`Shoe created successfully! ID: ${shoeId}`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      console.error("Shoe creation failed:", error);
      toast.error(`Shoe creation failed: ${error.message}`);
    }
  };

  const handleTestCreateRun = async () => {
    if (!debugInfo.shoes.length) {
      toast.error("Create a shoe first!");
      return;
    }

    try {
      console.log("Testing run creation...");
      const runId = await createRunMutation({
        date: new Date().toISOString().split("T")[0],
        distance: 5.0,
        duration: 35,
        pace: "7:00",
        shoeId: debugInfo.shoes[0].id,
        runType: "outdoor",
        surface: "road",
        effort: "easy",
        notes: "Debug test run",
      });
      console.log("Run created with ID:", runId);
      toast.success(`Run logged successfully! ID: ${runId}`);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error: any) {
      console.error("Run creation failed:", error);
      toast.error(`Run creation failed: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Debug Information
      </h1>

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Connection Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg ${
                connectionStatus === "connected"
                  ? "bg-green-50 border border-green-200"
                  : connectionStatus === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <h3
                className={`font-semibold ${
                  connectionStatus === "connected"
                    ? "text-green-800"
                    : connectionStatus === "error"
                      ? "text-red-800"
                      : "text-yellow-800"
                }`}
              >
                Convex Connection
              </h3>
              <p
                className={`text-sm ${
                  connectionStatus === "connected"
                    ? "text-green-600"
                    : connectionStatus === "error"
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              >
                Status: {connectionStatus}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                URL: {(import.meta as any).env.VITE_CONVEX_URL || "NOT SET"}
              </p>
            </div>
            <div
              className={`p-4 rounded-lg ${
                isAuthenticated
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h3
                className={`font-semibold ${
                  isAuthenticated ? "text-green-800" : "text-red-800"
                }`}
              >
                Authentication
              </h3>
              <p
                className={`text-sm ${
                  isAuthenticated ? "text-green-600" : "text-red-600"
                }`}
              >
                {isAuthenticated ? "Authenticated" : "Not authenticated"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                User ID: {user?.id || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Debug Logs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debug Logs
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setDebugLogs([])}
            className="mt-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            Clear Logs
          </button>
        </div>

        {/* Debug Connection Tests */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debug Connection Tests
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleTestBasicConnection}
                disabled={testBasicInsertPending}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {testBasicInsertPending ? "Testing..." : "🔌 Basic Connection"}
              </button>
              <button
                onClick={handleTestAuthenticatedInsert}
                disabled={testInsertPending || !isAuthenticated}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testInsertPending ? "Testing..." : "🔐 Auth Insert"}
              </button>
              <button
                onClick={handleClearTestData}
                disabled={clearTestDataPending || !isAuthenticated}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {clearTestDataPending ? "Clearing..." : "🗑️ Clear Tests"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Connection Status
                </h3>
                <div className="text-sm space-y-1">
                  <p>Server Time: {testConnectionQuery.data.serverTime}</p>
                  <p>User ID: {testConnectionQuery.data.userId || "None"}</p>
                  <p
                    className={`${testConnectionQuery.data.isAuthenticated ? "text-green-600" : "text-red-600"}`}
                  >
                    Auth:{" "}
                    {testConnectionQuery.data.isAuthenticated ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Database Status
                </h3>
                <div className="text-sm space-y-1">
                  <p>Total Collections: {allTestDocsQuery.data.total}</p>
                  <p>Assigned: {allTestDocsQuery.data.assigned.length}</p>
                  <p>Unassigned: {allTestDocsQuery.data.unassigned.length}</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Test Order:</strong> Try "Basic Connection" first (no
                auth needed), then "Auth Insert" (requires login), then check
                your Convex dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Mutation Testing */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Mutation Testing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={handleQuickSetup}
              disabled={isCreatingInitialData || !isAuthenticated}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
            >
              {isCreatingInitialData ? "Setting up..." : "🚀 Quick Setup"}
            </button>
            <button
              onClick={handleTestCreateCollection}
              disabled={!isAuthenticated}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Test Create Collection
            </button>
            <button
              onClick={handleTestCreateShoe}
              disabled={!debugInfo.collections.length || !isAuthenticated}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Test Create Shoe
            </button>
            <button
              onClick={handleTestCreateRun}
              disabled={!debugInfo.shoes.length || !isAuthenticated}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Test Create Run
            </button>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Quick Setup:</strong> Click "🚀 Quick Setup" to create
              initial collections and shoes automatically.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Manual Testing:</strong> Test mutations one by one. Check
              browser console and Convex dashboard after each test.
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-red-600 mt-2">
                <strong>Warning:</strong> You must be authenticated to test
                mutations.
              </p>
            )}
          </div>
        </div>

        {/* Auth Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Authentication Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg ${debugInfo.testAuth.isAuthenticated ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <h3
                className={`font-semibold ${debugInfo.testAuth.isAuthenticated ? "text-green-800" : "text-red-800"}`}
              >
                Authentication
              </h3>
              <p
                className={`text-lg font-bold ${debugInfo.testAuth.isAuthenticated ? "text-green-900" : "text-red-900"}`}
              >
                {debugInfo.testAuth.isAuthenticated
                  ? "✅ Authenticated"
                  : "❌ Not Authenticated"}
              </p>
              {debugInfo.testAuth.userId && (
                <p className="text-sm text-gray-600 mt-1">
                  User ID: {debugInfo.testAuth.userId}
                </p>
              )}
              {debugInfo.testAuth.error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {debugInfo.testAuth.error}
                </p>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">User Data</h3>
              <p className="text-sm text-blue-700">
                Collections: {debugInfo.testUserData.userCollections || 0}
              </p>
              <p className="text-sm text-blue-700">
                Shoes: {debugInfo.testUserData.userShoes || 0}
              </p>
              <p className="text-sm text-blue-700">
                Runs: {debugInfo.testUserData.userRuns || 0}
              </p>
              {debugInfo.testUserData.error && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {debugInfo.testUserData.error}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <button
              onClick={handleManualSetup}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              Manual Setup User Data
            </button>
            <button
              onClick={handleForceAssign}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ml-0 sm:ml-3"
            >
              Force Assign All Data
            </button>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Database Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">Total Data</h3>
              <p className="text-sm text-gray-700">
                Collections: {debugInfo.testData.totalCollections}
              </p>
              <p className="text-sm text-gray-700">
                Shoes: {debugInfo.testData.totalShoes}
              </p>
              <p className="text-sm text-gray-700">
                Runs: {debugInfo.testData.totalRuns}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800">Unassigned Data</h3>
              <p className="text-sm text-yellow-700">
                Collections: {debugInfo.testData.collectionsWithoutUser}
              </p>
              <p className="text-sm text-yellow-700">
                Shoes: {debugInfo.testData.shoesWithoutUser}
              </p>
              <p className="text-sm text-yellow-700">
                Runs: {debugInfo.testData.runsWithoutUser}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Query Results</h3>
              <p className="text-sm text-green-700">
                Collections: {debugInfo.collectionsCount}
              </p>
              <p className="text-sm text-green-700">
                Shoes: {debugInfo.shoesCount}
              </p>
              <p className="text-sm text-green-700">
                Active: {debugInfo.activeShoesCount}
              </p>
            </div>
          </div>
        </div>

        {/* PWA Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            PWA Status
          </h2>

          {/* PWA Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg border ${
                pwaStatus.serviceWorker.status === "registered"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h3
                className={`font-semibold ${
                  pwaStatus.serviceWorker.status === "registered"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                Service Worker
              </h3>
              <p
                className={`text-sm ${
                  pwaStatus.serviceWorker.status === "registered"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {pwaStatus.serviceWorker.supported
                  ? pwaStatus.serviceWorker.status
                  : "not supported"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                pwaStatus.installability.isInstalled
                  ? "bg-green-50 border-green-200"
                  : pwaStatus.installability.canInstall
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-200"
              }`}
            >
              <h3
                className={`font-semibold ${
                  pwaStatus.installability.isInstalled
                    ? "text-green-800"
                    : pwaStatus.installability.canInstall
                      ? "text-yellow-800"
                      : "text-gray-800"
                }`}
              >
                Installation
              </h3>
              <p
                className={`text-sm ${
                  pwaStatus.installability.isInstalled
                    ? "text-green-700"
                    : pwaStatus.installability.canInstall
                      ? "text-yellow-700"
                      : "text-gray-700"
                }`}
              >
                {pwaStatus.installability.isInstalled
                  ? "Installed"
                  : pwaStatus.installability.canInstall
                    ? "Installable"
                    : "Web Only"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                pwaStatus.manifest.available
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h3
                className={`font-semibold ${
                  pwaStatus.manifest.available
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                Manifest
              </h3>
              <p
                className={`text-sm ${
                  pwaStatus.manifest.available
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {pwaStatus.manifest.available ? "Available" : "Missing"}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                pwaStatus.cacheAPI.supported
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h3
                className={`font-semibold ${
                  pwaStatus.cacheAPI.supported
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                Cache API
              </h3>
              <p
                className={`text-sm ${
                  pwaStatus.cacheAPI.supported
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {pwaStatus.cacheAPI.supported
                  ? `${pwaStatus.cacheAPI.totalCaches || 0} caches`
                  : "Not supported"}
              </p>
            </div>
          </div>

          {/* Detailed PWA Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Worker Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Service Worker Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supported:</span>
                  <span
                    className={
                      pwaStatus.serviceWorker.supported
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.serviceWorker.supported ? "Yes" : "No"}
                  </span>
                </div>
                {pwaStatus.serviceWorker.supported && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={
                          pwaStatus.serviceWorker.status === "registered"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }
                      >
                        {pwaStatus.serviceWorker.status}
                      </span>
                    </div>
                    {pwaStatus.serviceWorker.scope && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scope:</span>
                        <span className="text-gray-800 truncate ml-2">
                          {pwaStatus.serviceWorker.scope}
                        </span>
                      </div>
                    )}
                    {pwaStatus.serviceWorker.installing && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Installing:</span>
                        <span
                          className={
                            pwaStatus.serviceWorker.installing
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }
                        >
                          {pwaStatus.serviceWorker.installing ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                    {pwaStatus.serviceWorker.waiting && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Waiting:</span>
                        <span
                          className={
                            pwaStatus.serviceWorker.waiting
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }
                        >
                          {pwaStatus.serviceWorker.waiting ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                    {pwaStatus.serviceWorker.active && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active:</span>
                        <span
                          className={
                            pwaStatus.serviceWorker.active
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {pwaStatus.serviceWorker.active ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Installation & Platform */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Installation & Platform
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Can Install:</span>
                  <span
                    className={
                      pwaStatus.installability.canInstall
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    {pwaStatus.installability.canInstall ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Is Installed:</span>
                  <span
                    className={
                      pwaStatus.installability.isInstalled
                        ? "text-green-600"
                        : "text-gray-600"
                    }
                  >
                    {pwaStatus.installability.isInstalled ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="text-gray-800">
                    {pwaStatus.installability.platform}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">User Agent:</span>
                  <p className="text-xs text-gray-800 mt-1 break-all">
                    {pwaStatus.installability.userAgent}
                  </p>
                </div>
              </div>
            </div>

            {/* Cache Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Cache Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache API:</span>
                  <span
                    className={
                      pwaStatus.cacheAPI.supported
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.cacheAPI.supported
                      ? "Supported"
                      : "Not Supported"}
                  </span>
                </div>
                {pwaStatus.cacheAPI.supported && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Caches:</span>
                      <span className="text-gray-800">
                        {pwaStatus.cacheAPI.totalCaches || 0}
                      </span>
                    </div>
                    {pwaStatus.cacheAPI.caches &&
                      pwaStatus.cacheAPI.caches.length > 0 && (
                        <div className="mt-2">
                          <span className="text-gray-600">Cache Names:</span>
                          <ul className="mt-1 text-xs text-gray-700 space-y-1">
                            {pwaStatus.cacheAPI.caches.map(
                              (cacheName, index) => (
                                <li key={index} className="truncate">
                                  • {cacheName}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>

            {/* Features & Permissions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Features & Permissions
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Notifications:</span>
                  <span
                    className={
                      pwaStatus.notifications.permission === "granted"
                        ? "text-green-600"
                        : pwaStatus.notifications.permission === "denied"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }
                  >
                    {pwaStatus.notifications.supported
                      ? pwaStatus.notifications.permission
                      : "not supported"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Background Sync:</span>
                  <span
                    className={
                      pwaStatus.backgroundSync.supported
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.backgroundSync.supported
                      ? "Supported"
                      : "Not Supported"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Background Fetch:</span>
                  <span
                    className={
                      pwaStatus.backgroundSync.backgroundFetch
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.backgroundSync.backgroundFetch
                      ? "Supported"
                      : "Not Supported"}
                  </span>
                </div>
                {pwaStatus.storageQuota.supported && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage Used:</span>
                      <span className="text-gray-800">
                        {pwaStatus.storageQuota.usagePercentage}%
                      </span>
                    </div>
                    {pwaStatus.storageQuota.quota && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage Quota:</span>
                        <span className="text-gray-800">
                          {(
                            pwaStatus.storageQuota.quota /
                            (1024 * 1024 * 1024)
                          ).toFixed(2)}{" "}
                          GB
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Manifest Details */}
          {pwaStatus.manifest.available && pwaStatus.manifest.manifest && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Manifest Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="text-gray-800 font-medium">
                    {pwaStatus.manifest.manifest.name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Short Name:</span>
                  <p className="text-gray-800 font-medium">
                    {pwaStatus.manifest.manifest.short_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Display:</span>
                  <p className="text-gray-800 font-medium">
                    {pwaStatus.manifest.manifest.display}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Theme Color:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor:
                          pwaStatus.manifest.manifest.theme_color,
                      }}
                    ></div>
                    <span className="text-gray-800 font-medium">
                      {pwaStatus.manifest.manifest.theme_color}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Start URL:</span>
                  <p className="text-gray-800 font-medium">
                    {pwaStatus.manifest.manifest.start_url}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Icons:</span>
                  <p className="text-gray-800 font-medium">
                    {pwaStatus.manifest.manifest.icons?.length || 0} icons
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PWA Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker
                    .getRegistration()
                    .then((registration) => {
                      if (registration) {
                        registration.update();
                        addLog("Service worker update triggered");
                        toast.success("Service worker update triggered");
                      }
                    });
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Update Service Worker
            </button>

            {pwaStatus.notifications.canRequest && (
              <button
                onClick={() => {
                  Notification.requestPermission().then((permission) => {
                    addLog(`Notification permission: ${permission}`);
                    setPwaStatus((prev) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        permission,
                        canRequest: false,
                      },
                    }));
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Request Notifications
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  const cacheNames = await caches.keys();
                  for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                  }
                  addLog(`Cleared ${cacheNames.length} caches`);
                  toast.success(`Cleared ${cacheNames.length} caches`);

                  // Refresh PWA status
                  const cacheStatus = await checkCacheAPI();
                  setPwaStatus((prev) => ({ ...prev, cacheAPI: cacheStatus }));
                } catch (error) {
                  addLog(`Cache clear failed: ${(error as Error).message}`);
                  toast.error("Failed to clear caches");
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Clear All Caches
            </button>

            <button
              onClick={() => {
                const manifestUrl = `${window.location.origin}/manifest.json`;
                window.open(manifestUrl, "_blank");
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              View Manifest
            </button>

            <button
              onClick={() => {
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker.ready.then((registration) => {
                    addLog("Service Worker is ready");
                    console.log("SW Registration:", registration);
                    if ("sync" in window.ServiceWorkerRegistration.prototype) {
                      addLog("Background Sync is supported");
                    }
                    toast.success("Service Worker diagnostics logged");
                  });
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              Test Service Worker
            </button>

            <button
              onClick={async () => {
                try {
                  const registration =
                    await navigator.serviceWorker.getRegistration();
                  if (registration) {
                    const cacheNames = await caches.keys();
                    let totalSize = 0;

                    for (const cacheName of cacheNames) {
                      const cache = await caches.open(cacheName);
                      const keys = await cache.keys();
                      addLog(`Cache "${cacheName}": ${keys.length} entries`);
                    }

                    addLog(`Total caches: ${cacheNames.length}`);
                    toast.success("Cache analysis completed");
                  }
                } catch (error) {
                  addLog(`Cache analysis failed: ${(error as Error).message}`);
                  toast.error("Cache analysis failed");
                }
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              Analyze Caches
            </button>

            {!pwaStatus.installability.isInstalled && (
              <button
                onClick={() => {
                  // Test install prompt
                  if ((window as any).deferredPrompt) {
                    const deferredPrompt = (window as any).deferredPrompt;
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                      addLog(`Install prompt result: ${choiceResult.outcome}`);
                      if (choiceResult.outcome === "accepted") {
                        toast.success("PWA installation accepted");
                      } else {
                        toast.info("PWA installation dismissed");
                      }
                      (window as any).deferredPrompt = null;
                    });
                  } else {
                    addLog("No install prompt available");
                    toast.info("PWA install prompt not available");
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                Test Install Prompt
              </button>
            )}
          </div>

          {/* PWA Install Prompt Listener */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">
              Install Prompt Status
            </h4>
            <p className="text-sm text-yellow-700">
              {(window as any).deferredPrompt
                ? "✅ Install prompt is available and ready"
                : "❌ Install prompt not available (may already be installed or not PWA-ready)"}
            </p>
          </div>
        </div>

        {/* PWA Performance & Offline Testing */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            PWA Performance & Offline Testing
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Network Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Online:</span>
                  <span
                    className={
                      navigator.onLine ? "text-green-600" : "text-red-600"
                    }
                  >
                    {navigator.onLine ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span className="text-gray-800">
                    {(navigator as any).connection?.effectiveType || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Downlink:</span>
                  <span className="text-gray-800">
                    {(navigator as any).connection?.downlink || "Unknown"} Mbps
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Performance */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Cache Performance
              </h3>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const start = performance.now();
                    try {
                      await fetch("/manifest.json");
                      const end = performance.now();
                      addLog(
                        `Manifest fetch time: ${(end - start).toFixed(2)}ms`,
                      );
                    } catch (error) {
                      addLog(
                        `Manifest fetch failed: ${(error as Error).message}`,
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Test Manifest Load Time
                </button>

                <button
                  onClick={async () => {
                    const start = performance.now();
                    try {
                      const response = await fetch(window.location.href);
                      const end = performance.now();
                      const cacheStatus = response.headers.get("cache-control");
                      addLog(`Page load time: ${(end - start).toFixed(2)}ms`);
                      addLog(
                        `Cache status: ${cacheStatus || "No cache headers"}`,
                      );
                    } catch (error) {
                      addLog(`Page fetch failed: ${(error as Error).message}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Test Page Cache Performance
                </button>
              </div>
            </div>

            {/* Offline Simulation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Offline Testing
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if ("serviceWorker" in navigator) {
                      // Simulate offline mode by intercepting fetch
                      addLog("Simulating offline mode...");
                      toast.info(
                        "Check browser DevTools to simulate offline mode",
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                  Simulate Offline Mode
                </button>

                <button
                  onClick={async () => {
                    try {
                      // Test if app works offline by checking cached resources
                      const cacheNames = await caches.keys();
                      let totalCachedResources = 0;

                      for (const cacheName of cacheNames) {
                        const cache = await caches.open(cacheName);
                        const keys = await cache.keys();
                        totalCachedResources += keys.length;
                      }

                      addLog(
                        `Offline readiness: ${totalCachedResources} cached resources`,
                      );

                      if (totalCachedResources > 0) {
                        toast.success(
                          `App has ${totalCachedResources} cached resources for offline use`,
                        );
                      } else {
                        toast.warning(
                          "No cached resources found for offline use",
                        );
                      }
                    } catch (error) {
                      addLog(
                        `Offline test failed: ${(error as Error).message}`,
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Test Offline Readiness
                </button>
              </div>
            </div>

            {/* Service Worker Messages */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Service Worker Communication
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (
                      "serviceWorker" in navigator &&
                      navigator.serviceWorker.controller
                    ) {
                      navigator.serviceWorker.controller.postMessage({
                        type: "PING",
                        timestamp: Date.now(),
                      });
                      addLog("Sent PING message to service worker");
                    } else {
                      addLog("No active service worker to communicate with");
                    }
                  }}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Ping Service Worker
                </button>

                <button
                  onClick={() => {
                    if (
                      "serviceWorker" in navigator &&
                      navigator.serviceWorker.controller
                    ) {
                      navigator.serviceWorker.controller.postMessage({
                        type: "SKIP_WAITING",
                      });
                      addLog("Requested service worker to skip waiting");
                      toast.info("Service worker skip waiting requested");
                    } else {
                      addLog("No service worker to skip waiting");
                    }
                  }}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Skip Waiting
                </button>
              </div>
            </div>
          </div>

          {/* PWA Quality Checklist */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">
              PWA Quality Checklist
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      pwaStatus.manifest.available
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.manifest.available ? "✅" : "❌"}
                  </span>
                  <span>Web App Manifest</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      pwaStatus.serviceWorker.status === "registered"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.serviceWorker.status === "registered"
                      ? "✅"
                      : "❌"}
                  </span>
                  <span>Service Worker</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      window.location.protocol === "https:" ||
                      window.location.hostname === "localhost"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {window.location.protocol === "https:" ||
                    window.location.hostname === "localhost"
                      ? "✅"
                      : "❌"}
                  </span>
                  <span>HTTPS/Localhost</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      pwaStatus.installability.canInstall ||
                      pwaStatus.installability.isInstalled
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {pwaStatus.installability.canInstall ||
                    pwaStatus.installability.isInstalled
                      ? "✅"
                      : "⚠️"}
                  </span>
                  <span>Installable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      pwaStatus.cacheAPI.supported &&
                      (pwaStatus.cacheAPI.totalCaches || 0) > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.cacheAPI.supported &&
                    (pwaStatus.cacheAPI.totalCaches || 0) > 0
                      ? "✅"
                      : "❌"}
                  </span>
                  <span>Offline Ready</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={
                      pwaStatus.manifest.available &&
                      pwaStatus.manifest.manifest?.icons &&
                      pwaStatus.manifest.manifest.icons.length > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.manifest.available &&
                    pwaStatus.manifest.manifest?.icons &&
                    pwaStatus.manifest.manifest.icons.length > 0
                      ? "✅"
                      : "❌"}
                  </span>
                  <span>App Icons</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PWA Lighthouse & Recommendations */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            PWA Lighthouse & Recommendations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lighthouse Testing */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Lighthouse PWA Audit
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Run Lighthouse PWA audit to check compliance with PWA
                  standards.
                </p>
                <button
                  onClick={() => {
                    const lighthouseUrl = `https://pagespeed.web.dev/report?url=${encodeURIComponent(window.location.origin)}`;
                    window.open(lighthouseUrl, "_blank");
                    addLog("Opened Lighthouse PWA audit");
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Run Lighthouse PWA Audit
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    toast.success("App URL copied to clipboard");
                    addLog("App URL copied for manual testing");
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Copy App URL
                </button>
              </div>
            </div>

            {/* PWA Score Estimation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                PWA Score Estimation
              </h3>
              <div className="space-y-2 text-sm">
                {/* Calculate estimated PWA score based on features */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Manifest:</span>
                  <span
                    className={
                      pwaStatus.manifest.available
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.manifest.available ? "+20" : "0"} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Worker:</span>
                  <span
                    className={
                      pwaStatus.serviceWorker.status === "registered"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.serviceWorker.status === "registered"
                      ? "+30"
                      : "0"}{" "}
                    pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HTTPS:</span>
                  <span
                    className={
                      window.location.protocol === "https:" ||
                      window.location.hostname === "localhost"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {window.location.protocol === "https:" ||
                    window.location.hostname === "localhost"
                      ? "+15"
                      : "0"}{" "}
                    pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installable:</span>
                  <span
                    className={
                      pwaStatus.installability.canInstall ||
                      pwaStatus.installability.isInstalled
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.installability.canInstall ||
                    pwaStatus.installability.isInstalled
                      ? "+20"
                      : "0"}{" "}
                    pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Offline Ready:</span>
                  <span
                    className={
                      pwaStatus.cacheAPI.supported &&
                      (pwaStatus.cacheAPI.totalCaches || 0) > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {pwaStatus.cacheAPI.supported &&
                    (pwaStatus.cacheAPI.totalCaches || 0) > 0
                      ? "+15"
                      : "0"}{" "}
                    pts
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-800">Estimated Score:</span>
                  <span className="text-blue-600">
                    {(pwaStatus.manifest.available ? 20 : 0) +
                      (pwaStatus.serviceWorker.status === "registered"
                        ? 30
                        : 0) +
                      (window.location.protocol === "https:" ||
                      window.location.hostname === "localhost"
                        ? 15
                        : 0) +
                      (pwaStatus.installability.canInstall ||
                      pwaStatus.installability.isInstalled
                        ? 20
                        : 0) +
                      (pwaStatus.cacheAPI.supported &&
                      (pwaStatus.cacheAPI.totalCaches || 0) > 0
                        ? 15
                        : 0)}
                    /100
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-3">
              PWA Improvement Recommendations
            </h3>
            <div className="space-y-2 text-sm">
              {!pwaStatus.manifest.available && (
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span className="text-yellow-700">
                    <strong>Add Web App Manifest:</strong> Required for PWA
                    installability and proper app metadata.
                  </span>
                </div>
              )}
              {pwaStatus.serviceWorker.status !== "registered" && (
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <span className="text-yellow-700">
                    <strong>Register Service Worker:</strong> Essential for
                    offline functionality and caching.
                  </span>
                </div>
              )}
              {window.location.protocol !== "https:" &&
                window.location.hostname !== "localhost" && (
                  <div className="flex items-start space-x-2">
                    <span className="text-red-600">❌</span>
                    <span className="text-red-700">
                      <strong>Enable HTTPS:</strong> Required for PWA features
                      and service worker registration.
                    </span>
                  </div>
                )}
              {!pwaStatus.cacheAPI.supported ||
                ((pwaStatus.cacheAPI.totalCaches || 0) === 0 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-700">
                      <strong>Implement Caching Strategy:</strong> Cache
                      important resources for offline functionality.
                    </span>
                  </div>
                ))}
              {pwaStatus.notifications.permission === "default" && (
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600">💡</span>
                  <span className="text-blue-700">
                    <strong>Request Notification Permission:</strong> Enable
                    push notifications for better user engagement.
                  </span>
                </div>
              )}
              {!pwaStatus.manifest.available ||
                !pwaStatus.manifest.manifest?.icons ||
                (pwaStatus.manifest.manifest.icons.length === 0 && (
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-yellow-700">
                      <strong>Add App Icons:</strong> Include various sized
                      icons for different platforms and contexts.
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* PWA Testing Tools */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              PWA Testing Tools
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  window.open("https://web.dev/measure/", "_blank");
                  addLog("Opened web.dev measure tool");
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                web.dev Measure
              </button>
              <button
                onClick={() => {
                  window.open("https://www.webpagetest.org/", "_blank");
                  addLog("Opened WebPageTest");
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                WebPageTest
              </button>
              <button
                onClick={() => {
                  window.open(
                    "https://developers.google.com/web/tools/lighthouse",
                    "_blank",
                  );
                  addLog("Opened Lighthouse documentation");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Lighthouse Docs
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800">Collections</h3>
            <p className="text-2xl font-bold text-blue-900">
              {debugInfo.collectionsCount}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800">Total Shoes</h3>
            <p className="text-2xl font-bold text-green-900">
              {debugInfo.shoesCount}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800">Active Shoes</h3>
            <p className="text-2xl font-bold text-purple-900">
              {debugInfo.activeShoesCount}
            </p>
          </div>
        </div>

        {/* Form Availability Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Form Availability Status
          </h2>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${debugInfo.collectionsCount > 0 ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="font-medium">Shoe Creation Form:</span>
              <span
                className={
                  debugInfo.collectionsCount > 0
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {debugInfo.collectionsCount > 0
                  ? "✅ Available"
                  : "❌ Blocked - No collections"}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${debugInfo.activeShoesCount > 0 ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="font-medium">Run Logging Form:</span>
              <span
                className={
                  debugInfo.activeShoesCount > 0
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {debugInfo.activeShoesCount > 0
                  ? "✅ Available"
                  : "❌ Blocked - No active shoes"}
              </span>
            </div>
          </div>
        </div>

        {/* Collections Detail */}
        {debugInfo.collections && debugInfo.collections.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Collections ({debugInfo.collectionsCount})
            </h2>
            <div className="space-y-2">
              {debugInfo.collections.map((collection: any) => (
                <div
                  key={collection.id}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: collection.color || "#3b82f6" }}
                  ></div>
                  <span className="font-medium">{collection.name}</span>
                  <span className="text-sm text-gray-500">
                    ID: {collection.id}
                  </span>
                  {collection.description && (
                    <span className="text-sm text-gray-600">
                      - {collection.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shoes Detail */}
        {debugInfo.shoes && debugInfo.shoes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Shoes ({debugInfo.shoesCount})
            </h2>
            <div className="space-y-2">
              {debugInfo.shoes.map((shoe: any) => (
                <div
                  key={shoe.id}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                >
                  <div
                    className={`w-4 h-4 rounded-full ${shoe.isRetired ? "bg-red-500" : "bg-green-500"}`}
                  ></div>
                  <span className="font-medium">{shoe.name}</span>
                  <span className="text-sm text-gray-600">
                    {shoe.brand} {shoe.model}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${shoe.isRetired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                  >
                    {shoe.isRetired ? "RETIRED" : "ACTIVE"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {shoe.currentMileage || 0}/{shoe.maxMileage || 500} mi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            Recommendations
          </h2>
          <div className="space-y-2 text-yellow-700">
            {debugInfo.collectionsCount === 0 && (
              <p>
                • Create your first collection at{" "}
                <code className="bg-yellow-200 px-1 rounded">
                  /collections/new
                </code>
              </p>
            )}
            {debugInfo.collectionsCount > 0 && debugInfo.shoesCount === 0 && (
              <p>
                • Add your first shoe at{" "}
                <code className="bg-yellow-200 px-1 rounded">/shoes/new</code>
              </p>
            )}
            {debugInfo.shoesCount > 0 && debugInfo.activeShoesCount === 0 && (
              <p>
                • All your shoes are retired. Add a new active shoe to log runs.
              </p>
            )}
            {debugInfo.collectionsCount > 0 &&
              debugInfo.activeShoesCount > 0 && (
                <p>
                  • ✅ Everything looks good! You should be able to use both
                  forms.
                </p>
              )}
          </div>
        </div>

        {/* Navigation Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Navigation Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/collections/new"
              search={{ modal: false }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Test Collection Form
            </Link>
            <Link
              to="/shoes/new"
              search={{ modal: false }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Test Shoe Form
            </Link>
            <Link
              to="/runs/new"
              search={{ modal: false }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
            >
              Test Run Form
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() =>
                navigate({ to: "/collections/new", search: { modal: false } })
              }
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Navigate to Collections
            </button>
            <button
              onClick={() =>
                navigate({ to: "/shoes/new", search: { modal: false } })
              }
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Navigate to Shoes
            </button>
            <button
              onClick={() =>
                navigate({ to: "/runs/new", search: { modal: false } })
              }
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Navigate to Runs
            </button>
          </div>
        </div>

        {/* Sample Data */}
        {debugInfo.testData.sampleCollection && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sample Data
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">
                  Sample Collection:
                </h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.testData.sampleCollection, null, 2)}
                </pre>
              </div>
              {debugInfo.testData.sampleShoe && (
                <div>
                  <h3 className="font-medium text-gray-700">Sample Shoe:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(debugInfo.testData.sampleShoe, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Data (for debugging) */}
        <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <summary className="font-semibold text-gray-700 cursor-pointer">
            Raw Data (Click to expand)
          </summary>
          <pre className="mt-4 text-xs bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
