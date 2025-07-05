import React, { useState, useEffect } from "react";
import { useConvexOffline } from "../hooks/useConvexOffline";
import { useConvex } from "convex/react";
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  TrendingUp,
  Settings,
} from "lucide-react";

interface Phase3OfflineDemoProps {
  className?: string;
}

export const Phase3OfflineDemo: React.FC<Phase3OfflineDemoProps> = ({
  className,
}) => {
  const convexClient = useConvex();
  const {
    isOnline,
    isConnected,
    connectionState,
    queueStatus,
    syncStats,
    lastSyncTime,
    manualSync,
    queueOperation,
    clearQueue,
    optimizeCacheStrategy,
  } = useConvexOffline(convexClient);

  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [optimizationReport, setOptimizationReport] = useState<any>(null);
  const [demoOperations, setDemoOperations] = useState<any[]>([]);

  // Simulate demo operations
  useEffect(() => {
    const operations = [
      { id: 1, type: "Create Run", priority: 85, status: "queued" },
      { id: 2, type: "Update Shoe", priority: 70, status: "queued" },
      { id: 3, type: "Upload Image", priority: 30, status: "queued" },
      { id: 4, type: "Sync Analytics", priority: 50, status: "queued" },
    ];
    setDemoOperations(operations);
  }, []);

  // Handle manual sync with progress
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const success = await manualSync();

      clearInterval(progressInterval);
      setSyncProgress(100);

      setTimeout(() => {
        setIsSyncing(false);
        setSyncProgress(0);
      }, 1000);

      if (success) {
        setDemoOperations((prev) =>
          prev.map((op) => ({ ...op, status: "synced" })),
        );
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  // Get optimization report
  const handleGetOptimization = async () => {
    try {
      const report = await optimizeCacheStrategy();
      setOptimizationReport(report);
    } catch (error) {
      console.error("Failed to get optimization report:", error);
    }
  };

  // Queue a demo operation
  const handleQueueDemo = () => {
    const success = queueOperation(
      "mutation",
      "api.shoes.createRun",
      {
        shoeId: "demo-shoe",
        distance: 5.2,
        duration: 1800,
        notes: "Demo offline run",
      },
      85,
    );

    if (success) {
      setDemoOperations((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "Demo Run",
          priority: 85,
          status: "queued",
        },
      ]);
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Phase 3: Enhanced Offline & Sync
          </h2>
          <p className="text-gray-600 mt-1">
            Intelligent offline operations with Convex integration
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 mr-1 inline" /> Online
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 mr-1 inline" /> Offline
            </>
          )}
        </span>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Connection Status</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Real-time connection monitoring and intelligent sync management
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionState.state === "connected"
                  ? "bg-green-500"
                  : connectionState.state === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />
            <div>
              <p className="font-medium">Convex State</p>
              <p className="text-sm text-gray-600 capitalize">
                {connectionState.state}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">Last Connected</p>
              <p className="text-sm text-gray-600">
                {formatTimeAgo(connectionState.lastConnectedTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <div>
              <p className="font-medium">Reconnect Attempts</p>
              <p className="text-sm text-gray-600">
                {connectionState.reconnectAttempts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Queue Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Offline Queue</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Operations queued for intelligent sync prioritization
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {queueStatus.immediate}
              </p>
              <p className="text-sm text-red-700">Immediate</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {queueStatus.background}
              </p>
              <p className="text-sm text-yellow-700">Background</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {queueStatus.deferred}
              </p>
              <p className="text-sm text-blue-700">Deferred</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {queueStatus.total}
              </p>
              <p className="text-sm text-gray-700">Total</p>
            </div>
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Syncing operations...</p>
                <p className="text-sm text-gray-600">
                  {Math.round(syncProgress)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing || queueStatus.total === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
              />
              Manual Sync
            </button>
            <button
              onClick={handleQueueDemo}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Zap className="w-4 h-4" />
              Queue Demo
            </button>
            <button
              onClick={clearQueue}
              disabled={queueStatus.total === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-4 h-4" />
              Clear Queue
            </button>
          </div>
        </div>
      </div>

      {/* Demo Operations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Queued Operations</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Example operations showing intelligent prioritization
        </p>
        <div className="space-y-2">
          {demoOperations.map((op) => (
            <div
              key={op.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    op.status === "synced"
                      ? "bg-green-500"
                      : op.status === "syncing"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                  }`}
                />
                <span className="font-medium">{op.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    op.priority >= 80
                      ? "bg-red-100 text-red-800"
                      : op.priority >= 60
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  Priority {op.priority}
                </span>
                <span className="text-sm text-gray-600 capitalize">
                  {op.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Sync Statistics</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Performance metrics and optimization insights
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Successful Operations</span>
              <span className="text-sm text-green-600">
                {syncStats.successfulOperations}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Failed Operations</span>
              <span className="text-sm text-red-600">
                {syncStats.failedOperations}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Sync Time</span>
              <span className="text-sm text-gray-600">
                {syncStats.totalSyncTime}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-gray-600">
                {formatTimeAgo(lastSyncTime)}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleGetOptimization}
              className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Get Optimization Report
            </button>
            {optimizationReport && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Strategy: {optimizationReport.strategy}
                </p>
                <p className="text-sm text-blue-800">
                  {optimizationReport.recommendations?.length || 0}{" "}
                  recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimization Report */}
      {optimizationReport && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Optimization Report</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Intelligent recommendations for better offline performance
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Strategy</p>
                <p className="text-lg font-bold capitalize">
                  {optimizationReport.strategy}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Storage Used</p>
                <p className="text-lg font-bold">
                  {optimizationReport.storageUsed || 0}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Cache Hit Rate</p>
                <p className="text-lg font-bold">
                  {optimizationReport.cacheStats?.hitRate || 0}%
                </p>
              </div>
            </div>

            {optimizationReport.recommendations &&
              optimizationReport.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Recommendations:</p>
                  {optimizationReport.recommendations.map(
                    (rec: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{rec.action}</p>
                          <p className="text-sm text-gray-600">{rec.reason}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Impact: {rec.impact}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase3OfflineDemo;
