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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8"
            >
              <Footprints className="w-4 h-4" />
              Built for runners, by runners
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight"
            >
              Know your shoes.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Run with confidence.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Track mileage, monitor wear, and get replacement alerts
              so you always run on shoes that support you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                onClick={() => navigate({ to: "/auth/signin" })}
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
                className="px-8 py-3.5 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
              >
                Get Started Free
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-60" />
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Simple tools to help you get the most miles out of every pair.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Activity className="w-6 h-6" />,
                color: "bg-blue-500",
                title: "Mileage Tracking",
                description: "Log runs and automatically track miles on each pair of shoes.",
              },
              {
                icon: <AlertTriangle className="w-6 h-6" />,
                color: "bg-amber-500",
                title: "Smart Alerts",
                description: "Get notified when shoes are nearing their replacement mileage.",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                color: "bg-emerald-500",
                title: "Analytics",
                description: "Understand your running patterns and shoe performance over time.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-11 h-11 ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Ready to start tracking?
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">
                Join runners who use ShoeTracker to maximize shoe lifespan and
                running performance.
              </p>
              <Button
                onClick={() => navigate({ to: "/auth/signin" })}
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
                className="px-8 py-3.5 text-base bg-white text-gray-900 hover:bg-gray-100 shadow-none"
              >
                Get Started Free
              </Button>
            </div>
          </div>
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
    <div className="min-h-dvh bg-gray-50/50 pb-safe">
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
              className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    {shoesNeedingReplacement.length} shoe{shoesNeedingReplacement.length > 1 ? "s" : ""} at 90%+ usage
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {shoesNeedingReplacement.slice(0, 3).map((shoe, index) => (
                      <Link
                        key={shoe?.id || index}
                        to="/shoes/$shoeId"
                        params={{ shoeId: shoe?.id || "" }}
                        className="inline-flex items-center px-2.5 py-1 bg-amber-100/80 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        {shoe?.name || "Unknown shoe"}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    ))}
                    {shoesNeedingReplacement.length > 3 && (
                      <span className="text-xs text-amber-600 px-2.5 py-1">
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
              <h2 className="text-lg font-semibold text-gray-900">
                Collections
              </h2>
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
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-150 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: collection.color || "#3b82f6",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {collection.name || "Unnamed Collection"}
                            </h3>
                            {collection.description && (
                              <p className="text-xs text-gray-500 truncate">
                                {collection.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-gray-400 tabular-nums">
                            {shoesInCollection} shoes
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
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
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Runs
              </h2>
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
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                  {formatDistance(run.distance || 0)} mi
                                </span>
                                {run.pace && (
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {run.pace}/mi
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>
                                  {run.date
                                    ? new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                    : "Unknown"}
                                </span>
                                {run.shoe && run.shoe.name && (
                                  <>
                                    <span className="text-gray-300">·</span>
                                    <span className="truncate">
                                      {run.shoe.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
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
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Quick Actions
          </h2>

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
