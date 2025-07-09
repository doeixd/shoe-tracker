import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useAuth } from "~/components/AuthProvider";

function DebugDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Test basic auth query
  const authStatusQuery = useQuery({
    ...convexQuery(api.auth.getAuthStatus, {}),
    retry: false,
  });

  // Test stats query
  const statsQuery = useQuery({
    ...convexQuery(api.shoes.getOverallStats, {}),
    enabled: isAuthenticated,
    retry: false,
  });

  // Test collections query
  const collectionsQuery = useQuery({
    ...convexQuery(api.shoes.getCollections, {}),
    enabled: isAuthenticated,
    retry: false,
  });

  const debugInfo = {
    auth: {
      isLoading: authLoading,
      isAuthenticated,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    },
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
    environment: {
      nodeEnv: process.env.NODE_ENV,
      convexUrl: import.meta.env.VITE_CONVEX_URL ? "Set" : "Not set",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Dashboard Debug Info
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Authentication Status
          </h2>
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <span className="font-medium">Loading:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                authLoading
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {authLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center space-x-4 mb-2">
              <span className="font-medium">Authenticated:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                isAuthenticated
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            {user && (
              <div className="mt-2 p-3 bg-gray-50 rounded">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                <p><strong>Email:</strong> {user.email || 'N/A'}</p>
              </div>
            )}
          </div>

          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Query Status
          </h2>

          <div className="space-y-4">
            {Object.entries(debugInfo.queries).map(([queryName, queryInfo]) => (
              <div key={queryName} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 capitalize">
                  {queryName} Query
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Loading:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      queryInfo.isLoading
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {queryInfo.isLoading ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Error:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      queryInfo.isError
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {queryInfo.isError ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {queryInfo.error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <strong>Error:</strong> {queryInfo.error}
                  </div>
                )}

                {queryInfo.data && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Data:</strong>
                    <pre className="mt-1 text-xs overflow-auto max-h-32">
                      {JSON.stringify(queryInfo.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800">
            Environment
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">NODE_ENV:</span>
              <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                {debugInfo.environment.nodeEnv}
              </span>
            </div>
            <div>
              <span className="font-medium">CONVEX_URL:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                debugInfo.environment.convexUrl === 'Set'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {debugInfo.environment.convexUrl}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4 mt-8 text-gray-800">
            Complete Debug Object
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/debug-dashboard")({
  component: DebugDashboard,
});
