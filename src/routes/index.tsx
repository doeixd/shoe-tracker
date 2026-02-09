import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAppData, useHasUserData } from "~/hooks/useAppData";
import {
  useAppDataSuspense,
  useHasUserDataSuspense,
} from "~/hooks/useSuspenseQueries";
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
import { checkAuth } from "~/utils/auth";
import { redirect } from "@tanstack/react-router";
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
  Star,
  Shield,
  Smartphone,
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
import { AuthWrapper } from "~/components/AuthWrapper";
import * as React from "react";

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  console.log({ isAuthenticated, isLoading });

  // Show loading state while checking authentication
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

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return (
      <AuthWrapper>
        <ErrorBoundary>
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading dashboard...</p>
                </div>
              </div>
            }
          >
            <Dashboard />
          </React.Suspense>
        </ErrorBoundary>
      </AuthWrapper>
    );
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}

export const Route = createFileRoute("/")({
  component: HomePage,
  // Optional auth loader - doesn't require authentication
  loader: async ({ context: { queryClient } }) => {
    try {
      // Check auth status without requiring it
      const authResult = await checkAuth(queryClient);
      console.log({ authResult });

      // If authenticated, prefetch dashboard data
      if (authResult.isAuthenticated) {
        await queryClient.ensureQueryData({
          ...convexQuery(api.dashboard.getAppData, {}),
          staleTime: 1000 * 60 * 5,
        });
      }

      return { auth: authResult };
    } catch (error: any) {
      // For errors, assume not authenticated and continue
      console.warn("Auth check failed in home loader:", error);
      return { auth: { isAuthenticated: false, user: null } };
    }
  },
});

// Landing page for unauthenticated users
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              Track Your Running Shoes
              <span className="text-blue-600 block">Like a Pro</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Monitor mileage, track wear patterns, and know exactly when to
              replace your running shoes. Keep your feet happy and your runs
              safer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                onClick={() => navigate({ to: "/auth/signin" })}
                variant="primary"
                icon={<Footprints className="w-5 h-5" />}
                className="px-8 py-3 text-lg"
              >
                Start Tracking
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%239C92AC%22%20fill-opacity=%220.05%22%3E%3Cpath%20d=%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Track Your Shoes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From casual joggers to marathon runners, our app helps you get the
              most out of your running shoes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <FeatureCard
                icon={<Activity className="w-8 h-8 text-blue-600" />}
                title="Mileage Tracking"
                description="Log every run and automatically track the miles on each pair of shoes"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FeatureCard
                icon={<AlertTriangle className="w-8 h-8 text-orange-600" />}
                title="Replacement Alerts"
                description="Get notified when your shoes are nearing their recommended replacement mileage"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <FeatureCard
                icon={<BarChart3 className="w-8 h-8 text-green-600" />}
                title="Analytics & Insights"
                description="View detailed analytics about your running patterns and shoe performance"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Tracking?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of runners who are already using Shoe Tracker to
            maximize their shoe lifespan and running performance.
          </p>
          <Button
            onClick={() => navigate({ to: "/auth/signin" })}
            variant="secondary"
            icon={<Footprints className="w-5 h-5" />}
            className="px-8 py-3 text-lg bg-white text-blue-600 hover:bg-gray-50"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
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
