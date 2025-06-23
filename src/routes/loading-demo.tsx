import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  RefreshCw,
  Zap,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";
import { withAuth } from "~/components/AuthProvider";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import { ProgressiveLoading } from "~/components/loading/ProgressiveLoading";
import {
  DashboardSkeleton,
  ShoesListingSkeleton,
  ListingSkeleton,
  DetailPageSkeleton
} from "~/components/loading/PageSkeletons";
import {
  InlineLoading,
  SmartLoader,
  LoadingOverlay,
  SectionLoadingSkeleton
} from "~/components/LoadingStates";

function LoadingDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoData, setDemoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const demos = [
    {
      id: "enhanced-loading",
      title: "Enhanced Loading System",
      description: "Progressive loading phases: instant → skeleton → spinner",
      layouts: ["dashboard", "shoes", "list", "detail"]
    },
    {
      id: "skeleton-components",
      title: "Layout-Specific Skeletons",
      description: "Skeletons that match actual content dimensions",
      layouts: ["dashboard", "shoes", "list", "detail"]
    },
    {
      id: "progressive-loading",
      title: "Progressive Loading",
      description: "Show stale data while fetching fresh content",
      layouts: ["stale-while-revalidate"]
    },
    {
      id: "error-states",
      title: "Error Handling",
      description: "Context-aware error states with retry mechanisms",
      layouts: ["network", "auth", "generic"]
    },
    {
      id: "inline-loading",
      title: "Inline Components",
      description: "Small loading states for sections and buttons",
      layouts: ["section", "button", "overlay"]
    }
  ];

  const simulateLoading = async (duration: number = 2000, shouldError: boolean = false) => {
    setIsLoading(true);
    setHasError(false);
    setDemoData(null);

    await new Promise(resolve => setTimeout(resolve, duration));

    if (shouldError) {
      setHasError(true);
    } else {
      setDemoData({
        message: "Demo data loaded successfully!",
        timestamp: new Date().toISOString(),
        items: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          name: `Demo Item ${i + 1}`,
          value: Math.floor(Math.random() * 100)
        }))
      });
    }
    setIsLoading(false);
  };

  const renderDemo = () => {
    if (!activeDemo) return null;

    switch (activeDemo) {
      case "enhanced-loading-dashboard":
        return (
          <EnhancedLoading
            message="Loading dashboard..."
            layout="dashboard"
            holdDelay={200}
            skeletonDelay={300}
            showProgress={true}
          />
        );

      case "enhanced-loading-shoes":
        return (
          <EnhancedLoading
            message="Loading shoes..."
            layout="shoes"
            holdDelay={200}
            skeletonDelay={300}
            showProgress={true}
          />
        );

      case "enhanced-loading-list":
        return (
          <EnhancedLoading
            message="Loading list..."
            layout="list"
            holdDelay={200}
            skeletonDelay={300}
            showProgress={true}
          />
        );

      case "enhanced-loading-detail":
        return (
          <EnhancedLoading
            message="Loading details..."
            layout="detail"
            holdDelay={200}
            skeletonDelay={300}
            showProgress={true}
          />
        );

      case "skeleton-dashboard":
        return <DashboardSkeleton animate={true} />;

      case "skeleton-shoes":
        return <ShoesListingSkeleton animate={true} />;

      case "skeleton-list":
        return <ListingSkeleton animate={true} />;

      case "skeleton-detail":
        return <DetailPageSkeleton animate={true} />;

      case "progressive-stale":
        return (
          <ProgressiveLoading
            data={demoData}
            isLoading={isLoading}
            error={hasError ? new Error("Demo error") : null}
            fallback={<SectionLoadingSkeleton lines={3} />}
            onRetry={() => simulateLoading(1000)}
            showStaleIndicator={true}
          >
            {(data, isStale) => (
              <div className={`p-6 bg-white rounded-xl shadow-soft ${isStale ? 'opacity-75' : ''}`}>
                <h3 className="text-lg font-semibold mb-4">
                  Demo Data {isStale && "(Updating...)"}
                </h3>
                <pre className="text-sm bg-gray-100 p-4 rounded">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </ProgressiveLoading>
        );

      case "error-network":
        return (
          <EnhancedLoading
            message="Loading content..."
            layout="list"
            error={new Error("Failed to fetch: network error")}
            onRetry={() => simulateLoading(1000)}
          />
        );

      case "error-auth":
        return (
          <EnhancedLoading
            message="Loading content..."
            layout="list"
            error={new Error("Not authenticated: access denied")}
            onRetry={() => simulateLoading(1000)}
          />
        );

      case "error-generic":
        return (
          <EnhancedLoading
            message="Loading content..."
            layout="list"
            error={new Error("Something went wrong unexpectedly")}
            onRetry={() => simulateLoading(1000)}
          />
        );

      case "inline-section":
        return (
          <div className="space-y-6 p-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-semibold mb-4">Section Loading Examples</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Inline Loading (Small)</h4>
                  <InlineLoading message="Processing..." size="sm" />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Section Skeleton</h4>
                  <SectionLoadingSkeleton lines={3} showTitle={true} />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Smart Loader</h4>
                  <SmartLoader
                    isLoading={isLoading}
                    hasData={!!demoData}
                    skeleton={<SectionLoadingSkeleton lines={2} />}
                    emptyState={<p className="text-gray-500">No data available</p>}
                    errorState={<p className="text-red-600">Failed to load data</p>}
                  >
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <p className="text-green-800">Data loaded successfully!</p>
                    </div>
                  </SmartLoader>
                </div>
              </div>
            </div>
          </div>
        );

      case "inline-overlay":
        return (
          <div className="p-6">
            <LoadingOverlay isLoading={isLoading} message="Updating content...">
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold mb-4">Content with Loading Overlay</h3>
                <p className="text-gray-600 mb-4">
                  This content remains visible while loading happens in the background.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium">Feature 1</h4>
                    <p className="text-sm text-gray-600">Some feature description</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium">Feature 2</h4>
                    <p className="text-sm text-gray-600">Another feature description</p>
                  </div>
                </div>
              </div>
            </LoadingOverlay>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Loading UX Demo
          </h1>
          <p className="text-lg text-gray-600">
            Interactive demonstration of the enhanced loading system improvements
          </p>
        </div>

        {/* Demo Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Demo Selection */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-xl font-semibold mb-4">Demo Categories</h2>

              {demos.map((demo) => (
                <div key={demo.id} className="mb-6 last:mb-0">
                  <h3 className="font-medium text-gray-900 mb-2">{demo.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{demo.description}</p>

                  <div className="space-y-2">
                    {demo.layouts.map((layout) => (
                      <button
                        key={`${demo.id}-${layout}`}
                        onClick={() => {
                          setActiveDemo(`${demo.id}-${layout}`);
                          if (demo.id === "progressive-loading" || demo.id === "inline-loading") {
                            simulateLoading(2000);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeDemo === `${demo.id}-${layout}`
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {layout.charAt(0).toUpperCase() + layout.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Controls */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="font-semibold mb-4">Demo Controls</h3>

              <div className="space-y-3">
                <button
                  onClick={() => simulateLoading(2000, false)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Trigger Success
                </button>

                <button
                  onClick={() => simulateLoading(2000, true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Trigger Error
                </button>

                <button
                  onClick={() => {
                    setActiveDemo(null);
                    setDemoData(null);
                    setIsLoading(false);
                    setHasError(false);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Clear Demo
                </button>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="font-semibold mb-4">Performance Improvements</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hold Delay</span>
                  <span className="text-sm font-medium">1000ms → 200ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Layout Shift</span>
                  <span className="text-sm font-medium text-green-600">Eliminated</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Recovery</span>
                  <span className="text-sm font-medium text-green-600">Intelligent</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Feedback</span>
                  <span className="text-sm font-medium text-green-600">Immediate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft min-h-[600px] overflow-hidden">
              {activeDemo ? (
                <div className="h-full">
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Demo: {activeDemo.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {isLoading && <Clock className="w-4 h-4 animate-pulse" />}
                        {hasError && <WifiOff className="w-4 h-4 text-red-500" />}
                        {demoData && !isLoading && <CheckCircle className="w-4 h-4 text-green-500" />}
                        <span>
                          {isLoading ? 'Loading...' : hasError ? 'Error' : demoData ? 'Loaded' : 'Ready'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-full">
                    {renderDemo()}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8">
                  <div>
                    <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Select a Demo
                    </h3>
                    <p className="text-gray-600">
                      Choose a loading demo from the sidebar to see the improvements in action.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-soft p-6 text-center"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-2">80% Faster Perceived Loading</h4>
            <p className="text-sm text-gray-600">Reduced hold delay from 1000ms to 200ms</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-soft p-6 text-center"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold mb-2">Zero Layout Shift</h4>
            <p className="text-sm text-gray-600">Skeleton components preserve exact dimensions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-soft p-6 text-center"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold mb-2">Smart Error Recovery</h4>
            <p className="text-sm text-gray-600">Context-aware errors with retry mechanisms</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-soft p-6 text-center"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold mb-2">Progressive Loading</h4>
            <p className="text-sm text-gray-600">Show stale data while fetching fresh content</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/loading-demo")({
  component: withAuth(LoadingDemoPage),
});
