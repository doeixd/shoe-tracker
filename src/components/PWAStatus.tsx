import { useState, useEffect } from "react";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  CheckCircle,
  Shield,
  Zap,
  Globe,
  Gauge,
  Users,
  Database,
  RefreshCw,
  Battery,
  Signal,
  Monitor,
  Tablet,
  Info,
  X,
  ExternalLink,
} from "lucide-react";

interface PWAStatusProps {
  showDetails?: boolean;
  onClose?: () => void;
}

interface PWAInfo {
  isInstalled: boolean;
  isOnline: boolean;
  isIOSPWA: boolean;
  isAndroidPWA: boolean;
  hasServiceWorker: boolean;
  platform: string;
  installable: boolean;
  version: string;
}

export function PWAStatus({ showDetails = false, onClose }: PWAStatusProps) {
  const [pwaInfo, setPwaInfo] = useState<PWAInfo>({
    isInstalled: false,
    isOnline: true,
    isIOSPWA: false,
    isAndroidPWA: false,
    hasServiceWorker: false,
    platform: "unknown",
    installable: false,
    version: "1.0.0",
  });
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectPWAInfo = async () => {
      // Detect platform
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isIOSStandalone = isIOS && isStandalone;
      const isAndroidStandalone = isAndroid && isStandalone;

      // Check service worker
      const hasServiceWorker = "serviceWorker" in navigator;

      // Check if installable
      const isInstallable =
        !isStandalone &&
        ("beforeinstallprompt" in window || (isIOS && !isStandalone));

      // Get platform info
      let platform = "Desktop";
      if (isIOS) platform = "iOS";
      else if (isAndroid) platform = "Android";
      else if (window.innerWidth < 768) platform = "Mobile";

      setPwaInfo({
        isInstalled: isStandalone,
        isOnline: navigator.onLine,
        isIOSPWA: isIOSStandalone,
        isAndroidPWA: isAndroidStandalone,
        hasServiceWorker,
        platform,
        installable: isInstallable,
        version: "1.0.0",
      });

      // Get cache size
      try {
        if ("storage" in navigator && "estimate" in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          setCacheSize(estimate.usage || 0);
        }
      } catch (error) {
        console.debug("Storage API not available");
      }

      // Get battery info
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as any).getBattery();
          setBatteryInfo({
            charging: battery.charging,
            level: Math.round(battery.level * 100),
          });
        }
      } catch (error) {
        console.debug("Battery API not available");
      }

      // Get network info
      try {
        if ("connection" in navigator) {
          const connection = (navigator as any).connection;
          setNetworkInfo({
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          });
        }
      } catch (error) {
        console.debug("Network Information API not available");
      }
    };

    detectPWAInfo();

    // Listen for online/offline changes
    const handleOnline = () =>
      setPwaInfo((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setPwaInfo((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDeviceIcon = () => {
    switch (pwaInfo.platform) {
      case "iOS":
        return <Smartphone className="w-4 h-4" />;
      case "Android":
        return <Smartphone className="w-4 h-4" />;
      case "Desktop":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Tablet className="w-4 h-4" />;
    }
  };

  const getInstallationStatus = () => {
    if (pwaInfo.isInstalled) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Installed as PWA</span>
        </div>
      );
    }

    if (pwaInfo.installable) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Ready to Install</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">Web App</span>
      </div>
    );
  };

  if (!showDetails) {
    // Compact status indicator
    return (
      <div className="flex items-center space-x-4 text-xs">
        {/* Online/Offline Status */}
        <div
          className={`flex items-center space-x-1 ${
            pwaInfo.isOnline ? "text-green-600" : "text-red-600"
          }`}
        >
          {pwaInfo.isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span>{pwaInfo.isOnline ? "Online" : "Offline"}</span>
        </div>

        {/* PWA Status */}
        {pwaInfo.isInstalled && (
          <div className="flex items-center space-x-1 text-blue-600">
            <Smartphone className="w-3 h-3" />
            <span>PWA</span>
          </div>
        )}

        {/* Service Worker Status */}
        {pwaInfo.hasServiceWorker && (
          <div className="flex items-center space-x-1 text-purple-600">
            <Shield className="w-3 h-3" />
            <span>SW</span>
          </div>
        )}
      </div>
    );
  }

  // Detailed PWA status panel
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Info className="w-5 h-5" />
          <span>PWA Status</span>
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Installation
          </span>
          {getInstallationStatus()}
        </div>

        {/* Platform Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Platform
          </span>
          <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
            {getDeviceIcon()}
            <span className="text-sm font-medium">{pwaInfo.platform}</span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Connection
          </span>
          <div
            className={`flex items-center space-x-2 ${
              pwaInfo.isOnline ? "text-green-600" : "text-red-600"
            }`}
          >
            {pwaInfo.isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {pwaInfo.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Service Worker */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Service Worker
          </span>
          <div
            className={`flex items-center space-x-2 ${
              pwaInfo.hasServiceWorker ? "text-green-600" : "text-gray-400"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">
              {pwaInfo.hasServiceWorker ? "Active" : "Not Available"}
            </span>
          </div>
        </div>

        {/* Cache Size */}
        {cacheSize > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Cache Size
            </span>
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatBytes(cacheSize)}
              </span>
            </div>
          </div>
        )}

        {/* Network Info */}
        {networkInfo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Network
            </span>
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Signal className="w-4 h-4" />
              <span className="text-sm font-medium">
                {networkInfo.effectiveType?.toUpperCase()} •{" "}
                {networkInfo.downlink}Mbps
              </span>
            </div>
          </div>
        )}

        {/* Battery Info */}
        {batteryInfo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Battery
            </span>
            <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Battery
                className={`w-4 h-4 ${batteryInfo.charging ? "text-green-500" : ""}`}
              />
              <span className="text-sm font-medium">
                {batteryInfo.level}% {batteryInfo.charging && "(Charging)"}
              </span>
            </div>
          </div>
        )}

        {/* Version */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Version
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {pwaInfo.version}
          </span>
        </div>
      </div>

      {/* PWA Features */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          PWA Features
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 text-green-600">
            <Shield className="w-3 h-3" />
            <span className="text-xs">Secure (HTTPS)</span>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <Zap className="w-3 h-3" />
            <span className="text-xs">Fast Loading</span>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <WifiOff className="w-3 h-3" />
            <span className="text-xs">Offline Ready</span>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <RefreshCw className="w-3 h-3" />
            <span className="text-xs">Auto Updates</span>
          </div>
        </div>
      </div>

      {/* Installation Hint */}
      {!pwaInfo.isInstalled && pwaInfo.installable && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Download className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {pwaInfo.platform === "iOS"
                  ? 'Tap the Share button and select "Add to Home Screen" to install.'
                  : "Click the install button in your browser to add ShoeFit to your home screen."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Learn More Link */}
      <div className="mt-4 text-center">
        <a
          href="https://web.dev/progressive-web-apps/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center space-x-1"
        >
          <span>Learn more about PWAs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export default PWAStatus;
