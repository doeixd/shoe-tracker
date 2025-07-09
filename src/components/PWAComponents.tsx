import { useState, useEffect } from "react";
import {
  useOffline,
  useOnlineStatus,
  useSyncStatus,
  useConflictResolution,
  usePWAInstall,
  useServiceWorkerUpdate,
} from "~/hooks/useOffline";
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  X,
  Settings,
  Loader2,
  ArrowDown,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "./FormComponents";

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after a delay to avoid being too aggressive
    if (isInstallable && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed]);

  useEffect(() => {
    // Check if user previously dismissed the prompt
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const accepted = await install();
      if (accepted) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error("Install failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt || isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm z-[100]">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Install MyShoeTracker App
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Get the full app experience with offline access and faster
              loading.
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                loading={isInstalling}
                className="flex items-center space-x-1"
              >
                {isInstalling ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                <span>{isInstalling ? "Installing..." : "Install"}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-500"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Offline Status Indicator - Basic version without provider dependency
export function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <div className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium text-white bg-green-500">
      {isOnline ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span>{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}

// Sync Status Panel
export function SyncStatusPanel() {
  const { syncState, forceSyncNow, clearSyncErrors, issyncing } =
    useSyncStatus();
  const { conflicts, hasConflicts, resolveConflict } = useConflictResolution();
  const [showErrors, setShowErrors] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  const handleForcSync = async () => {
    try {
      await forceSyncNow();
    } catch (error) {
      console.error("Force sync failed:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Sync Status</h3>
        <Button
          size="sm"
          onClick={handleForcSync}
          disabled={issyncing}
          loading={issyncing}
          className="flex items-center space-x-1"
        >
          <RefreshCw className={`w-3 h-3 ${issyncing ? "animate-spin" : ""}`} />
          <span>Sync Now</span>
        </Button>
      </div>

      <div className="space-y-3">
        {/* Sync Status */}
        <div className="flex items-center space-x-2">
          {syncState.status === "syncing" && (
            <>
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-blue-600">Syncing data...</span>
            </>
          )}
          {syncState.status === "idle" && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Up to date</span>
            </>
          )}
          {syncState.status === "error" && (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Sync failed</span>
            </>
          )}
        </div>

        {/* Last Sync Time */}
        {syncState.lastSync && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last synced: {syncState.lastSync.toLocaleString()}</span>
          </div>
        )}

        {/* Pending Operations */}
        {syncState.pendingOperations > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="text-sm text-yellow-800">
              {syncState.pendingOperations} operation(s) pending sync
            </div>
          </div>
        )}

        {/* Sync Errors */}
        {syncState.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-800">
                {syncState.errors.length} sync error(s)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  {showErrors ? "Hide" : "Show"}
                </button>
                <button
                  onClick={clearSyncErrors}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {showErrors && (
              <div className="mt-2 space-y-1">
                {syncState.errors.map((error, index) => (
                  <div
                    key={index}
                    className="text-xs text-red-700 bg-red-100 p-2 rounded"
                  >
                    <div className="font-medium">{error.operation}</div>
                    <div>{error.error}</div>
                    <div className="text-red-600">
                      {error.timestamp.toLocaleString()} (Retry:{" "}
                      {error.retryCount})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conflicts */}
        {hasConflicts && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-orange-800">
                {conflicts.length} conflict(s) need resolution
              </div>
              <button
                onClick={() => setShowConflicts(!showConflicts)}
                className="text-xs text-orange-600 hover:text-orange-700"
              >
                {showConflicts ? "Hide" : "Resolve"}
              </button>
            </div>

            {showConflicts && (
              <div className="mt-2 space-y-2">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="bg-orange-100 p-2 rounded">
                    <div className="text-xs font-medium text-orange-900 mb-1">
                      {conflict.type} conflict:{" "}
                      {conflict.localData?.name || conflict.id}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resolveConflict(conflict.id, "local")}
                        className="text-xs"
                      >
                        Use Local
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resolveConflict(conflict.id, "remote")}
                        className="text-xs"
                      >
                        Use Remote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Update Available Banner
export function UpdateAvailableBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <ArrowDown className="w-5 h-5" />
          <div>
            <div className="font-medium">App Update Available</div>
            <div className="text-sm text-blue-100">
              A new version of MyShoeTracker is ready to install
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={applyUpdate}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Update Now
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-100 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// PWA Features Showcase
export function PWAFeaturesCard() {
  const { isInstalled } = usePWAInstall();

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Lightning Fast",
      description: "Instant loading with cached data",
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: "Works Offline",
      description: "Track runs even without internet",
    },
    {
      icon: <Smartphone className="w-5 h-5 text-blue-500" />,
      title: "Native Feel",
      description: "App-like experience on any device",
    },
  ];

  if (isInstalled) {
    return null; // Don't show features if already installed
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Get the Full Experience
        </h3>
        <p className="text-sm text-gray-600">
          Install MyShoeTracker as an app for the best experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {features.map((feature, index) => (
          <div key={index} className="text-center">
            <div className="flex justify-center mb-2">{feature.icon}</div>
            <div className="text-sm font-medium text-gray-900 mb-1">
              {feature.title}
            </div>
            <div className="text-xs text-gray-600">{feature.description}</div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-500">
        Look for the install prompt or check your browser's menu
      </div>
    </div>
  );
}

// Offline Data Info
export function OfflineDataInfo() {
  const { state } = useOffline();

  if (!state.isInitialized) {
    return null;
  }

  const { offlineStats } = state;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Offline Data</h4>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Collections</div>
          <div className="font-medium">{offlineStats.collectionsCount}</div>
        </div>
        <div>
          <div className="text-gray-600">Shoes</div>
          <div className="font-medium">{offlineStats.shoesCount}</div>
        </div>
        <div>
          <div className="text-gray-600">Runs</div>
          <div className="font-medium">{offlineStats.runsCount}</div>
        </div>
        <div>
          <div className="text-gray-600">Cache Size</div>
          <div className="font-medium">
            {(offlineStats.cacheSize / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>
      </div>

      {offlineStats.pendingSyncItems > 0 && (
        <div className="mt-3 text-xs text-orange-600">
          {offlineStats.pendingSyncItems} items waiting to sync
        </div>
      )}
    </div>
  );
}

// Compact PWA Status Bar
export function PWAStatusBar() {
  const { isOnline } = useOnlineStatus();
  const { issyncing, pendingOperations } = useSyncStatus();
  const { hasConflicts } = useConflictResolution();

  return (
    <div className="flex items-center space-x-4 text-xs text-gray-500">
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-500" />
        )}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {issyncing && (
        <div className="flex items-center space-x-1">
          <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
          <span>Syncing</span>
        </div>
      )}

      {pendingOperations > 0 && (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-yellow-500" />
          <span>{pendingOperations} pending</span>
        </div>
      )}

      {hasConflicts && (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-orange-500" />
          <span>Conflicts</span>
        </div>
      )}
    </div>
  );
}
