import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useAuth, authDebug } from "~/components/AuthProvider";
import {
  runAuthDiagnostics,
  exportAuthDebugEvents,
  exportAuthMetrics,
  formatDebugDataForExport,
  type AuthDiagnosticResult,
} from "~/utils/authDebug";
import {
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  Shield,
  User,
  Settings,
  Activity,
  TrendingUp,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from "lucide-react";

function DebugDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [diagnostics, setDiagnostics] = useState<AuthDiagnosticResult | null>(
    null,
  );
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [authEvents, setAuthEvents] = useState<any[]>([]);
  const [authMetrics, setAuthMetrics] = useState<any>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Test basic auth query
  const authStatusQuery = useQuery({
    ...convexQuery(api.auth.getAuthStatus, {}),
    retry: false,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Test stats query
  const statsQuery = useQuery({
    ...convexQuery(api.shoes.getOverallStats, {}),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Test collections query
  const collectionsQuery = useQuery({
    ...convexQuery(api.shoes.getCollections, {}),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Load auth debug data
  useEffect(() => {
    const loadDebugData = async () => {
      try {
        const events = await exportAuthDebugEvents();
        const metrics = await exportAuthMetrics();
        setAuthEvents(events);
        setAuthMetrics(metrics);
      } catch (error) {
        console.warn("Could not load auth debug data:", error);
      }
    };

    loadDebugData();

    if (autoRefresh) {
      const interval = setInterval(loadDebugData, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const result = await runAuthDiagnostics(queryClient);
      setDiagnostics(result);
    } catch (error) {
      console.error("Failed to run diagnostics:", error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Export debug data
  const exportDebugData = () => {
    if (!diagnostics) return;

    const exportData = {
      diagnostics,
      authEvents,
      authMetrics,
      queries: {
        authStatus: {
          isLoading: authStatusQuery.isLoading,
          isError: authStatusQuery.isError,
          error: authStatusQuery.error?.message,
          data: authStatusQuery.data,
        },
        stats: {
          isLoading: statsQuery.isLoading,
          isError: statsQuery.isError,
          error: statsQuery.error?.message,
          data: statsQuery.data,
        },
        collections: {
          isLoading: collectionsQuery.isLoading,
          isError: collectionsQuery.isError,
          error: collectionsQuery.error?.message,
          data: collectionsQuery.data,
        },
      },
      timestamp: new Date().toISOString(),
    };

    const dataStr = formatDebugDataForExport(exportData);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auth-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy data to clipboard
  const copyToClipboard = (data: any) => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  // Clear debug events
  const clearDebugEvents = () => {
    authDebug.clearEvents();
    setAuthEvents([]);
  };

  // Reset metrics
  const resetMetrics = () => {
    authDebug.resetMetrics();
    setAuthMetrics(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "healthy":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-600" />
                Auth Debug Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive authentication diagnostics and monitoring
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  autoRefresh
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Activity className="w-4 h-4 inline mr-1" />
                Auto Refresh {autoRefresh ? "On" : "Off"}
              </button>
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                {showSensitiveData ? (
                  <EyeOff className="w-4 h-4 inline mr-1" />
                ) : (
                  <Eye className="w-4 h-4 inline mr-1" />
                )}
                {showSensitiveData ? "Hide" : "Show"} Sensitive Data
              </button>
              <button
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 inline mr-1 ${isRunningDiagnostics ? "animate-spin" : ""}`}
                />
                Run Diagnostics
              </button>
              {diagnostics && (
                <button
                  onClick={exportDebugData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export Data
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Overall Status */}
        {diagnostics && (
          <div
            className={`p-6 rounded-lg border-2 mb-6 ${getStatusColor(diagnostics.overall)}`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(diagnostics.overall)}
              <div>
                <h2 className="text-lg font-semibold">
                  Overall Status:{" "}
                  {diagnostics.overall.charAt(0).toUpperCase() +
                    diagnostics.overall.slice(1)}
                </h2>
                <p className="text-sm opacity-80">
                  Environment: {diagnostics.environment.environment} | Domain:{" "}
                  {diagnostics.environment.domain} | Time:{" "}
                  {new Date(diagnostics.environment.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Auth Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Current Authentication Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Loading:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    authLoading
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {authLoading ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Authenticated:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    isAuthenticated
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isAuthenticated ? "Yes" : "No"}
                </span>
              </div>
              {user && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">
                    User Information
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>ID:</strong>{" "}
                      {showSensitiveData
                        ? user.id
                        : `${user.id.slice(0, 8)}...`}
                    </p>
                    <p>
                      <strong>Name:</strong> {user.name || "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {showSensitiveData
                        ? user.email || "N/A"
                        : user.email
                          ? "***@***.***"
                          : "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environment Information */}
          {diagnostics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Environment Configuration
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Environment:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      diagnostics.environment.environment === "production"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {diagnostics.environment.environment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Convex URL:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      diagnostics.configuration.hasConvexUrl
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {diagnostics.configuration.hasConvexUrl
                      ? "Configured"
                      : "Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Domain:</span>
                  <span className="text-gray-600">
                    {diagnostics.environment.domain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Protocol:</span>
                  <span className="text-gray-600">
                    {diagnostics.environment.protocol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Timezone:</span>
                  <span className="text-gray-600">
                    {diagnostics.environment.timezone}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Connectivity Tests */}
          {diagnostics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Connectivity Tests
              </h2>
              <div className="space-y-3">
                {diagnostics.connectivity.map((test, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className="font-medium text-sm">{test.name}</span>
                    </div>
                    <div className="text-right text-xs">
                      {test.duration && (
                        <span className="text-gray-500">{test.duration}ms</span>
                      )}
                      {test.error && (
                        <div
                          className="text-red-600 max-w-xs truncate"
                          title={test.error}
                        >
                          {test.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auth Flow Tests */}
          {diagnostics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Authentication Flow
              </h2>
              <div className="space-y-3">
                {diagnostics.authFlow.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <span className="font-medium text-sm">{step.step}</span>
                    </div>
                    <div className="text-right text-xs">
                      {step.duration && (
                        <span className="text-gray-500">{step.duration}ms</span>
                      )}
                      {step.error && (
                        <div
                          className="text-red-600 max-w-xs truncate"
                          title={step.error}
                        >
                          {step.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Status */}
          <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Query Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Auth Status", query: authStatusQuery },
                { name: "Stats", query: statsQuery },
                { name: "Collections", query: collectionsQuery },
              ].map((item) => (
                <div key={item.name} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Loading:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.query.isLoading
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.query.isLoading ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error:</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.query.isError
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.query.isError ? "Yes" : "No"}
                      </span>
                    </div>
                    {item.query.error && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <strong>Error:</strong> {item.query.error.message}
                      </div>
                    )}
                    {item.query.data && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <button
                          onClick={() => copyToClipboard(item.query.data)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Copy className="w-3 h-3" />
                          Copy Data
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth Metrics */}
          {authMetrics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Auth Metrics
                </h2>
                <button
                  onClick={resetMetrics}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Sign-in Attempts:</span>
                      <span className="font-mono">
                        {authMetrics.signInAttempts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sign-in Successes:</span>
                      <span className="font-mono text-green-600">
                        {authMetrics.signInSuccesses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sign-in Failures:</span>
                      <span className="font-mono text-red-600">
                        {authMetrics.signInFailures}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Sign-out Attempts:</span>
                      <span className="font-mono">
                        {authMetrics.signOutAttempts}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Query Errors:</span>
                      <span className="font-mono text-red-600">
                        {authMetrics.queryErrors}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Activity:</span>
                      <span className="font-mono text-xs">
                        {new Date(
                          authMetrics.lastActivity,
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Auth Events */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Auth Events ({authEvents.length})
              </h2>
              <button
                onClick={clearDebugEvents}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {authEvents
                .slice(-10)
                .reverse()
                .map((event, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.level)}`}
                      >
                        {event.level}
                      </span>
                      <span className="text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1 font-medium">{event.event}</div>
                    {event.data && showSensitiveData && (
                      <div className="mt-1 text-gray-600 font-mono text-xs">
                        {JSON.stringify(event.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              {authEvents.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No auth events recorded yet
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {diagnostics && diagnostics.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recommendations
              </h2>
              <div className="space-y-2">
                {diagnostics.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Raw Debug Data */}
        {diagnostics && showSensitiveData && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Raw Debug Data
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/debug-dashboard")({
  component: DebugDashboard,
});
