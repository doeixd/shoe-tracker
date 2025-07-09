import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppData, useHasUserData } from "~/hooks/useAppData";
import { useAppDataSuspense, useHasUserDataSuspense } from "~/hooks/useSuspenseQueries";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { useAuth } from "~/components/AuthProvider";
import { Onboarding } from "~/components/Onboarding";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import {
  PageLoading,
  SectionLoading,
  EmptyState,
  ErrorState,
} from "~/components/LoadingStates";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import { useEffect } from "react";
import { requireAuth } from "~/utils/auth";
import {
  formatDistance,
  formatDuration,
  USAGE_LEVEL_COLORS,
  USAGE_LEVEL_LABELS,
} from "~/types";
import { useState } from "react";
import {
  BarChart3,
  Footprints,
  Timer,
  Loader2,
  Activity,
  AlertTriangle,
  TrendingUp,
  Plus,
  Folder,
  Calendar,
  MapPin,
  Target,
  Zap,
  Trophy,
  Clock,
  Package,
  ArrowRight,
  ChevronRight,
  Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import { PageHeader, PageContainer } from "~/components/PageHeader";
import {
  MetricCard,
  FeatureCard,
  EmptyStateCard,
  ActionCard,
} from "~/components/ui/Cards";
import { Button } from "~/components/FormComponents";
import { cn } from "~/components/ui/ui";
import * as React from "react";

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
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
              Please sign in to access your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      }>
        <Home />
      </React.Suspense>
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
  // Loader with authentication redirect
  loader: async ({ context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Prefetch critical dashboard data using new app data query
    await queryClient.ensureQueryData({
      ...convexQuery(api.dashboard.getAppData, {}),
      staleTime: 1000 * 60 * 5,
    });

    return { user };
  },
});

function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isFirstVisit } = useFirstVisit();

  console.log("🔍 Dashboard Home component rendering...");

  // Use suspense query for instant loading - no loading states needed
  const { data: appData } = useAppDataSuspense();

  // Extract data from the suspense query with safe defaults
  const {
    collections = [],
    shoes = [],
    runs: recentRuns = [],
    stats,
    shoesNeedingReplacement = [],
  } = appData || {};

  // Check if user has any data for onboarding
  const { data: hasDataCheck } = useHasUserDataSuspense();

  // Show onboarding if user has no data at all (collections, shoes, or runs)
  const hasAnyData = hasDataCheck?.hasAnyData || false;
  if (!hasAnyData && hasDataCheck) {
    return (
      <Onboarding
        onComplete={() => {
          // Invalidate app data query to refresh data
          queryClient.invalidateQueries({
            queryKey: ["convex", "dashboard", "getAppData", {}],
          });
        }}
      />
    );
  }

  // Provide immediate fallback data to prevent any loading states
  const safeStats = stats || {
    totalCollections: collections?.length || 0,
    totalShoes: shoes?.length || 0,
    activeShoes: shoes?.filter((shoe) => !shoe.isRetired)?.length || 0,
    retiredShoes: shoes?.filter((shoe) => shoe.isRetired)?.length || 0,
    totalRuns: recentRuns?.length || 0,
    totalDistance: 0,
    totalDuration: 0,
    avgDistance: 0,
    monthlyRuns: 0,
    monthlyDistance: 0,
    shoesNeedingReplacement: shoesNeedingReplacement?.length || 0,
  };

  // Monthly distance is already calculated server-side
  const monthlyDistance = safeStats.monthlyDistance || 0;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-safe">
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Track your running shoes and monitor your progress"
          animate={false}
          actions={
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: "/shoes",
                    search: {
                      showRetired: false,
                      collection: "",
                      sortBy: "name" as const,
                      brand: "",
                      usageLevel: "",
                      dateRange: "all" as const,
                      modal: true,
                    },
                  })
                }
                variant="outline"
                icon={<Plus className="w-5 h-5" />}
                className="sm:w-auto"
              >
                Add Shoe
              </Button>
              <Button
                onClick={() =>
                  navigate({
                    to: "/runs",
                    search: { modal: true },
                  })
                }
                icon={<Plus className="w-5 h-5" />}
                className="sm:w-auto"
              >
                Log Run
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: 0.1 },
          })}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricCard
              title="Total Shoes"
              value={safeStats.totalShoes || 0}
              subtitle="Active pairs"
              icon={<Footprints className="w-6 h-6" />}
              color="primary"
            />
            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: 0.2 },
              })}
            >
              <MetricCard
                title="Total Runs"
                value={safeStats.totalRuns || 0}
                subtitle="All time"
                icon={<Activity className="w-6 h-6" />}
                color="success"
              />
            </motion.div>
            {/* Recent Activity */}
            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5, delay: 0.3 },
              })}
            >
              <MetricCard
                title="Total Distance"
                value={formatDistance(safeStats.totalDistance || 0)}
                subtitle="Miles logged"
                icon={<MapPin className="w-6 h-6" />}
                color="warning"
              />
            </motion.div>
            {/* Quick Actions */}
            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5, delay: 0.2 },
              })}
            >
              <MetricCard
                title="This Month"
                value={`${safeStats.monthlyRuns || 0}`}
                subtitle={`${formatDistance(monthlyDistance)} miles`}
                icon={<Calendar className="w-6 h-6" />}
                color="neutral"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {shoesNeedingReplacement.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-3xl p-6 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Shoes Need Replacement
                  </h3>
                  <p className="text-red-700 mb-4">
                    {shoesNeedingReplacement.length} of your shoes are at 90%+
                    usage and may need replacement soon.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {shoesNeedingReplacement.slice(0, 3).map((shoe, index) => (
                      <Link
                        key={shoe?.id || index}
                        to="/shoes/$shoeId"
                        params={{ shoeId: shoe?.id || "" }}
                        className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-800 text-sm font-medium rounded-xl hover:bg-red-200 transition-colors"
                      >
                        {shoe?.name || "Unknown shoe"}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    ))}
                    {shoesNeedingReplacement.length > 3 && (
                      <span className="text-sm text-red-600 px-3 py-1.5">
                        +{shoesNeedingReplacement.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Collections */}
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.2, delay: 0.1, ease: "easeOut" },
            })}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Collections
                </h2>
              </div>
              <Link
                to="/collections"
                search={{ modal: false }}
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {collections.length === 0 ? (
              <EmptyStateCard
                title="No collections yet"
                description="Create your first collection to organize your shoes by type or purpose."
                icon={<Folder className="w-8 h-8 text-gray-400" />}
                actionLabel="Create Collection"
                onAction={() =>
                  navigate({ to: "/collections", search: { modal: true } })
                }
              />
            ) : (
              <div className="space-y-3">
                {collections.slice(0, 5).map((collection, index) => {
                  // Safely count shoes in this collection
                  const shoesInCollection = shoes.filter(
                    (shoe) => shoe && shoe.collectionId === collection.id,
                  ).length;

                  return (
                    <motion.div
                      key={collection.id}
                      {...getAnimationProps(isFirstVisit, {
                        initial: { opacity: 0, y: 5 },
                        animate: { opacity: 1, y: 0 },
                        transition: {
                          duration: 0.15,
                          delay: index * 0.03,
                          ease: "easeOut",
                        },
                      })}
                    >
                      <Link
                        to="/collections/$collectionId"
                        params={{ collectionId: collection.id }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: collection.color || "#3b82f6",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {collection.name || "Unnamed Collection"}
                            </h3>
                            {collection.description && (
                              <p className="text-sm text-gray-600 truncate">
                                {collection.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {shoesInCollection}
                            </div>
                            <div className="text-xs text-gray-500">shoes</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Runs */}
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.2, delay: 0.1, ease: "easeOut" },
            })}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Recent Runs
                </h2>
              </div>
              <Link
                to="/runs"
                search={{ modal: false }}
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {recentRuns.length === 0 ? (
              <EmptyStateCard
                title="No runs logged yet"
                description={
                  shoes.length === 0
                    ? "Add your first shoe to start logging runs"
                    : "Start logging your runs to track progress"
                }
                icon={<Activity className="w-8 h-8 text-gray-400" />}
                actionLabel={
                  shoes.length === 0 ? "Add First Shoe" : "Log First Run"
                }
                onAction={() => {
                  if (shoes.length === 0) {
                    navigate({
                      to: "/shoes",
                      search: {
                        showRetired: false,
                        collection: "",
                        sortBy: "name" as const,
                        brand: "",
                        usageLevel: "",
                        dateRange: "all" as const,
                        modal: true,
                      },
                    });
                  } else {
                    navigate({
                      to: "/runs",
                      search: { modal: true },
                    });
                  }
                }}
              />
            ) : (
              <div className="space-y-3">
                {recentRuns
                  .slice(0, 5)
                  .map((run, index) => {
                    // Safely handle run data
                    if (!run || !run.id) return null;

                    return (
                      <motion.div
                        key={run.id}
                        {...getAnimationProps(isFirstVisit, {
                          initial: { opacity: 0, y: 5 },
                          animate: { opacity: 1, y: 0 },
                          transition: {
                            duration: 0.15,
                            delay: index * 0.03,
                            ease: "easeOut",
                          },
                        })}
                      >
                        <Link
                          to="/runs/$runId"
                          params={{ runId: run.id }}
                          className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-100 shadow-soft hover:shadow-medium transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <Activity className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">
                                  {formatDistance(run.distance || 0)}
                                </span>
                                {run.pace && (
                                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                                    {run.pace}/mi
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>
                                  {run.date
                                    ? new Date(run.date).toLocaleDateString()
                                    : "Unknown date"}
                                </span>
                                {run.shoe && run.shoe.name && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">
                                      {run.shoe.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {run.runType || "Run"}
                              </div>
                              {run.duration && (
                                <div className="text-xs text-gray-500">
                                  {formatDuration(run.duration)}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })
                  .filter(Boolean)}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionCard
              title="Log a Run"
              description="Record your latest running session with detailed metrics"
              icon={<Plus className="w-6 h-6" />}
              actionLabel="Log Run"
              onAction={() =>
                navigate({ to: "/runs/new", search: { modal: false } })
              }
              variant="primary"
            />
            <ActionCard
              title="Add New Shoe"
              description="Add a new pair of running shoes to your collection"
              icon={<Footprints className="w-6 h-6" />}
              actionLabel="Add Shoe"
              onAction={() =>
                navigate({
                  to: "/shoes",
                  search: {
                    showRetired: true,
                    collection: "",
                    sortBy: "name" as const,
                    brand: "",
                    usageLevel: "",
                    dateRange: "all" as const,
                    modal: true,
                  },
                })
              }
              variant="secondary"
            />
            <ActionCard
              title="View Analytics"
              description="Analyze your running performance and shoe usage patterns"
              icon={<BarChart3 className="w-6 h-6" />}
              actionLabel="View Analytics"
              onAction={() => navigate({ to: "/analytics" })}
              variant="secondary"
            />
          </div>
        </motion.div>
      </PageContainer>
    </div>
  );
}
