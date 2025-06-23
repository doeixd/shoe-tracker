import { useState, useEffect, useCallback } from "react";
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Smartphone,
  X,
  Loader2,
  Shield,
  Zap,
  Check,
  ArrowUp,
  Battery,
  Signal
} from "lucide-react";

// iOS PWA detection
export function useIOSPWA() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detect standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if installable
    const isInstallableApp = iOS && !standalone;
    setIsInstallable(isInstallableApp);
  }, []);

  return { isIOS, isStandalone, isInstallable };
}

// Enhanced PWA Install Banner specifically for iOS
export function IOSInstallBanner() {
  const { isIOS, isStandalone, isInstallable } = useIOSPWA();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isIOS || isStandalone || dismissed) return;

    const hasShownBefore = localStorage.getItem('ios-install-banner-shown');
    if (!hasShownBefore) {
      const timer = setTimeout(() => {
        setShowBanner(true);
        localStorage.setItem('ios-install-banner-shown', 'true');
      }, 10000); // Show after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isIOS, isStandalone, dismissed]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('ios-install-banner-dismissed', Date.now().toString());
  };

  if (!showBanner || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Add to Home Screen
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Install ShoeFit for the best experience. Tap the Share button
              <ArrowUp className="inline w-4 h-4 mx-1" />
              then "Add to Home Screen".
            </p>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Zap className="w-3 h-3" />
                <span>Fast</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced status bar for iOS PWA
export function IOSStatusBar() {
  const { isIOS, isStandalone } = useIOSPWA();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!isIOS || !isStandalone) return;

    // Update time every minute
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000);

    // Battery API (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });

        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }

    return () => clearInterval(timer);
  }, [isIOS, isStandalone]);

  if (!isIOS || !isStandalone) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-11 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-between px-4 text-white text-sm font-medium">
      <div className="flex items-center space-x-1">
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
        </div>

        {batteryLevel !== null && (
          <div className="flex items-center space-x-1">
            <span className="text-xs">{batteryLevel}%</span>
            <Battery className={`w-4 h-4 ${isCharging ? 'text-green-400' : ''}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Pull to refresh component for iOS
export function PullToRefresh({ onRefresh, children }: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, (currentY - startY) * 0.5);

      if (distance > 10) {
        setPullDistance(distance);
        setIsPulling(true);
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance > 80) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull to refresh indicator */}
      <div
        className={`absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translateX(-50%) translateY(${Math.min(pullDistance - 40, 20)}px)`,
        }}
      >
        <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center">
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5 text-blue-600" />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${isPulling ? Math.min(pullDistance, 80) : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Enhanced offline indicator
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (!online) {
        setShowOfflineToast(true);
      } else {
        setShowOfflineToast(false);
      }
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <>
      {/* Status indicator */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}>
        {isOnline ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span>{isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Offline toast */}
      {showOfflineToast && (
        <div className="fixed top-16 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-4 h-4 text-red-600" />
              <div className="text-sm text-red-800">
                You're offline. Some features may not be available.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Haptic feedback hook for iOS
export function useHapticFeedback() {
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
    if (typeof window === "undefined") return;

    // iOS haptic feedback
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [30],
        heavy: [50],
        selection: [10, 10, 10]
      };
      navigator.vibrate(patterns[type]);
    }

    // Web Vibration API fallback
    if ('vibrate' in navigator) {
      const durations = {
        light: 10,
        medium: 30,
        heavy: 50,
        selection: [10, 10, 10]
      };
      navigator.vibrate(durations[type]);
    }
  }, []);

  return hapticFeedback;
}

// Enhanced app update banner
export function AppUpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSWUpdate = () => {
      setShowUpdate(true);
    };

    // Listen for service worker updates
    window.addEventListener('swUpdate', handleSWUpdate);

    return () => {
      window.removeEventListener('swUpdate', handleSWUpdate);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      // Trigger service worker update
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <Download className="w-5 h-5" />
          <div>
            <div className="font-medium">App Update Available</div>
            <div className="text-sm text-blue-100">
              A new version of ShoeFit is ready
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isUpdating ? 'Updating...' : 'Update'}</span>
          </button>

          <button
            onClick={() => setShowUpdate(false)}
            className="text-blue-100 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
