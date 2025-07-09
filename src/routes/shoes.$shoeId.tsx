import React from "react";
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  shoeQueries,
  collectionQueries,
  runQueries,
  statsQueries,
  useRetireShoeMutation,
} from "~/queries";
import { toast } from "sonner";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import { createQueryConfig } from "~/utils/routeLoading";
import { useAuth } from "~/components/AuthProvider";
import { AuthErrorBoundary } from "~/components/AuthErrorBoundary";
import { requireAuth } from "~/utils/auth";
import { ImageDisplay } from "~/components/ImageHandler";
import { motion } from "motion/react";
import {
  formatDistance,
  formatDuration,
  USAGE_LEVEL_COLORS,
  USAGE_LEVEL_LABELS,
  type ShoeWithStats,
  type Run,
  type Collection,
} from "~/types";
import {
  FeatureCard,
  MetricCard,
  CardGrid,
  Card,
  EmptyStateCard,
} from "~/components/ui/Cards";
import { Button } from "~/components/FormComponents";
import { BackToShoes } from "~/components/ui/BackButton";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { EditShoeForm } from "~/components/EditShoeForm";
import { useIsMobile } from "~/hooks/useIsMobile";
import {
  Footprints,
  Clock,
  Gauge,
  Zap,
  Calendar,
  DollarSign,
  Weight,
  Ruler,
  StickyNote,
  Play,
  Edit3,
  BarChart3,
  AlertTriangle,
  Trophy,
  Activity,
  Lock,
} from "lucide-react";
import { cn } from "~/components/ui/ui";

function ShoeDetailPage() {
  return <ShoeDetail />;
}

export const Route = createFileRoute("/shoes/$shoeId")({
  component: ShoeDetailPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      editModal: Boolean(search?.editModal),
    };
  },
  errorComponent: ({ error }) => {
    const isShoeNotFound = error.message?.includes("Shoe not found");

    if (isShoeNotFound) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Shoe Not Found
                </h2>
                <p className="text-gray-600">
                  The shoe you're looking for doesn't exist or has been removed.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/shoes"
                  search={{
                    showRetired: true,
                    collection: "",
                    sortBy: "name",
                    modal: false,
                    brand: "",
                    usageLevel: "",
                    dateRange: "all",
                  }}
                >
                  <Button className="flex-1 sm:flex-none">View Shoes</Button>
                </Link>
                <Link to="/">
                  <Button variant="secondary" className="flex-1 sm:flex-none">
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-gray-600">{error.message}</p>
            </div>
            <div className="flex justify-center">
              <Link to="/">
                <Button>Go Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  },
  loader: async ({ context: { queryClient }, params: { shoeId } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Prefetch critical data in parallel
    const shoePromise = queryClient.ensureQueryData(shoeQueries.detail(shoeId));
    const shoeStatsPromise = queryClient.ensureQueryData(
      shoeQueries.withStats(shoeId),
    );
    const runsPromise = queryClient.ensureQueryData(
      runQueries.list(50, shoeId),
    );

    // Wait for critical data
    await Promise.all([shoePromise, shoeStatsPromise, runsPromise]);

    // Prefetch related data in background (non-blocking)
    queryClient.prefetchQuery(shoeQueries.list(false)).catch(() => {});
    queryClient.prefetchQuery(collectionQueries.list()).catch(() => {});
    queryClient.prefetchQuery(runQueries.withShoes(20)).catch(() => {});
    queryClient.prefetchQuery(statsQueries.overall()).catch(() => {});

    return {
      shoeId,
      user,
    };
  },
});

function ShoeDetail() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const { shoeId } = Route.useParams();
  const search = useSearch({ from: "/shoes/$shoeId" });
  const isMobile = useIsMobile();
  const loaderData = Route.useLoaderData();
  const matches = useMatches();

  // Check if we're on the edit route
  const isEditRoute = matches.some(
    (match) => match.id === "/edit"
  ) || window.location.pathname.includes("/edit");

  // Debug logging
  console.log("Debug - Route matching:", {
    currentPath: window.location.pathname,
    matches: matches.map(m => ({ id: m.id, pathname: m.pathname, fullPath: m.fullPath })),
    isEditRoute,
    isMobile,
    matchIds: matches.map(m => m.id),
    hasEditInPath: window.location.pathname.includes("/edit"),
  });

  // All hooks must be called before any early returns
  const retireShoeMutation = useRetireShoeMutation();

  const shoeStatsQuery = useQuery(
    createQueryConfig(shoeQueries.withStats(shoeId), {
      staleTime: 3 * 60 * 1000, // 3 minutes
    }),
  );

  const runsQuery = useQuery(
    createQueryConfig(runQueries.list(10, shoeId), {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
  );

  const collectionsQuery = useQuery(
    createQueryConfig(collectionQueries.list(), {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),
  );

  // Handle retire mutation
  React.useEffect(() => {
    if (retireShoeMutation.isSuccess) {
      toast.success("Shoe retired successfully!");
      shoeStatsQuery.refetch();
    }
    if (retireShoeMutation.isError) {
      toast.error("Failed to retire shoe");
    }
  }, [
    retireShoeMutation.isSuccess,
    retireShoeMutation.isError,
    shoeStatsQuery,
  ]);

  if (isLoading) {
    return (
      <EnhancedLoading
        message="Loading shoe details..."
        layout="detail"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-sm text-gray-600">
              Please sign in to access your shoes
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading states
  const isDataLoading =
    shoeStatsQuery.isLoading ||
    runsQuery.isLoading ||
    collectionsQuery.isLoading;

  if (isDataLoading) {
    return (
      <EnhancedLoading
        message="Loading shoe details..."
        layout="detail"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  // Handle errors
  if (
    shoeStatsQuery.error &&
    !shoeStatsQuery.error.message?.includes("not authenticated")
  ) {
    throw shoeStatsQuery.error;
  }
  if (
    runsQuery.error &&
    !runsQuery.error.message?.includes("not authenticated")
  ) {
    throw runsQuery.error;
  }
  if (
    collectionsQuery.error &&
    !collectionsQuery.error.message?.includes("not authenticated")
  ) {
    throw collectionsQuery.error;
  }

  const shoeData = shoeStatsQuery.data as any;
  const recentRuns = (runsQuery.data as any[]) || [];
  const collections = (collectionsQuery.data as any[]) || [];

  if (!shoeData) {
    return (
      <EnhancedLoading
        message="Loading shoe details..."
        layout="detail"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  const collection = collections.find(
    (c: any) => c?.id === shoeData?.collectionId,
  );

  // If we're on the edit route, render the outlet instead of the detail view
  if (isEditRoute) {
    console.log("Rendering outlet for edit route - isEditRoute:", isEditRoute, "isMobile:", isMobile);
    return (
      <AuthErrorBoundary>
        <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
          <Outlet />
        </div>
      </AuthErrorBoundary>
    );
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-safe">
        <div className="max-w-7xl mx-auto p-4 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <BackToShoes />
            </div>

            {/* Shoe Header Card */}
            <Card className="p-6 lg:p-8" shadow="medium">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Image */}
                <div className="w-full lg:w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <ImageDisplay
                    src={shoeData.imageUrl}
                    alt={shoeData.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                </div>

                {/* Shoe Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                          {shoeData.name}
                        </h1>
                        {shoeData.isRetired && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            RETIRED
                          </span>
                        )}
                      </div>
                      <p className="text-xl text-gray-600">
                        {shoeData.brand} {shoeData.model}
                      </p>
                      {collection && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: collection.color }}
                          />
                          <Link
                            to="/collections/$collectionId"
                            params={{ collectionId: collection.id }}
                            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                          >
                            {collection.name}
                          </Link>
                        </div>
                      )}
                      {shoeData.size && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          Size: {shoeData.size}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() =>
                          navigate({
                            to: "/runs/new",
                            search: { modal: false },
                          })
                        }
                        icon={<Play className="w-4 h-4" />}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Log Run
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          console.log(
                            "Edit button clicked, isMobile:",
                            isMobile,
                          );
                          if (isMobile) {
                            console.log("Navigating to modal");
                            navigate({
                              to: "/shoes/$shoeId",
                              params: { shoeId },
                              search: { editModal: true },
                            });
                          } else {
                            console.log("Navigating to edit page");
                            navigate({
                              to: "/shoes/$shoeId/edit",
                              params: { shoeId },
                              search: { modal: false },
                            });
                          }
                        }}
                        icon={<Edit3 className="w-4 h-4" />}
                      >
                        Edit Shoe
                      </Button>

                      {!shoeData.isRetired && (
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to retire this shoe?",
                              )
                            ) {
                              retireShoeMutation.mutate({ id: shoeId });
                            }
                          }}
                          disabled={retireShoeMutation.isPending}
                        >
                          {retireShoeMutation.isPending
                            ? "Retiring..."
                            : "Retire Shoe"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Usage Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6" shadow="medium">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Usage Status
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-gray-600 font-medium">
                      Current Mileage
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatDistance(shoeData.stats.currentMileage)} /{" "}
                      {formatDistance(shoeData.maxMileage)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-3 rounded-full transition-all duration-300",
                        shoeData.stats.usageLevel === "new" ||
                          shoeData.stats.usageLevel === "good"
                          ? "bg-green-500"
                          : shoeData.stats.usageLevel === "moderate"
                            ? "bg-yellow-500"
                            : shoeData.stats.usageLevel === "high"
                              ? "bg-orange-500"
                              : "bg-red-500",
                      )}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, shoeData.stats.usagePercentage)}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    {shoeData.stats.usageLevel === "replace" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
                      USAGE_LEVEL_COLORS[
                        shoeData.stats
                          .usageLevel as keyof typeof USAGE_LEVEL_COLORS
                      ],
                    )}
                  >
                    {shoeData.stats.usageLevel === "replace" && (
                      <AlertTriangle className="w-4 h-4 mr-1" />
                    )}
                    {
                      USAGE_LEVEL_LABELS[
                        shoeData.stats
                          .usageLevel as keyof typeof USAGE_LEVEL_LABELS
                      ]
                    }
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {shoeData.stats.milesRemaining.toFixed(0)} miles remaining
                    </div>
                    <div className="text-xs text-gray-500">
                      {shoeData.stats.usagePercentage.toFixed(1)}% used
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardGrid cols={4} gap="lg">
              <MetricCard
                title="Total Runs"
                value={shoeData.stats.totalRuns}
                subtitle="Logged"
                icon={<Activity className="w-6 h-6" />}
                color="primary"
              />
              <MetricCard
                title="Total Distance"
                value={formatDistance(shoeData.stats.totalDistance)}
                subtitle="Miles"
                icon={<Footprints className="w-6 h-6" />}
                color="success"
              />
              <MetricCard
                title="Total Time"
                value={formatDuration(shoeData.stats.totalDuration)}
                subtitle="Running"
                icon={<Clock className="w-6 h-6" />}
                color="neutral"
              />
              <MetricCard
                title="Avg Pace"
                value={
                  shoeData.stats.avgPace
                    ? `${Math.floor(shoeData.stats.avgPace)}:${String(Math.floor((shoeData.stats.avgPace % 1) * 60)).padStart(2, "0")}`
                    : "—"
                }
                subtitle="Per mile"
                icon={<Zap className="w-6 h-6" />}
                color="warning"
              />
            </CardGrid>
          </motion.div>

          {/* Shoe Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6" shadow="medium">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <StickyNote className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Shoe Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {shoeData.purchaseDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Purchase Date
                        </span>
                        <div className="text-sm text-gray-900">
                          {new Date(shoeData.purchaseDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {shoeData.purchasePrice && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Purchase Price
                        </span>
                        <div className="text-sm text-gray-900">
                          ${shoeData.purchasePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                  {shoeData.weight && (
                    <div className="flex items-center gap-3">
                      <Weight className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Weight
                        </span>
                        <div className="text-sm text-gray-900">
                          {shoeData.weight}g
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {shoeData.dropHeight !== undefined && (
                    <div className="flex items-center gap-3">
                      <Ruler className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Heel Drop
                        </span>
                        <div className="text-sm text-gray-900">
                          {shoeData.dropHeight}mm
                        </div>
                      </div>
                    </div>
                  )}
                  {shoeData.isRetired && shoeData.retiredDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Retired Date
                        </span>
                        <div className="text-sm text-gray-900">
                          {new Date(shoeData.retiredDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {shoeData.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 block mb-2">
                        Notes
                      </span>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {shoeData.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Recent Runs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-0" shadow="medium">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Recent Runs
                  </h2>
                </div>
                <Link
                  to="/runs"
                  search={{ modal: false }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  View All Runs
                </Link>
              </div>

              {recentRuns.length === 0 ? (
                <div className="p-8">
                  <EmptyStateCard
                    title="No runs logged yet"
                    description="Start tracking your runs with this shoe to see performance data and usage statistics."
                    icon={<Activity className="w-8 h-8 text-gray-400" />}
                    actionLabel="Log First Run"
                    onAction={() =>
                      navigate({ to: "/runs/new", search: { modal: false } })
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Distance
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Pace
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="relative px-6 py-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {recentRuns.map((run: Run, index) => (
                        <motion.tr
                          key={run.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Date(run.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDistance(run.distance)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.duration ? formatDuration(run.duration) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {run.pace || "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                              {run.runType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to="/runs/$runId"
                              params={{ runId: run.id }}
                              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            >
                              View
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Edit Modal for Mobile */}
      {isMobile && search.editModal && (
        <FormModalSheet
          isOpen={search.editModal}
          onClose={() => {
            navigate({
              to: "/shoes/$shoeId",
              params: { shoeId },
              search: { editModal: false },
            });
          }}
          title="Edit Shoe"
          description="Update the details of your running shoe"
          formHeight="large"
        >
          <EditShoeForm
            shoe={shoeData}
            onSuccess={(updatedShoeId) => {
              navigate({
                to: "/shoes/$shoeId",
                params: { shoeId: updatedShoeId },
                search: { editModal: false },
              });
            }}
            onCancel={() => {
              navigate({
                to: "/shoes/$shoeId",
                params: { shoeId },
                search: { editModal: false },
              });
            }}
            isModal={true}
          />
        </FormModalSheet>
      )}


    </AuthErrorBoundary>
  );
}
