import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { runQueries, shoeQueries } from "~/queries";
import { requireAuth } from "~/utils/auth";
import { useAuth } from "~/components/AuthProvider";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import {
  formatDistance,
  formatDuration,
  RUN_TYPE_OPTIONS,
  RUN_SURFACE_OPTIONS,
  RUN_EFFORT_OPTIONS,
} from "~/types";
import { motion } from "motion/react";
import { Card, MetricCard, CardGrid, FeatureCard } from "~/components/ui/Cards";
import { BackToRuns } from "~/components/ui/BackButton";
import { Button } from "~/components/FormComponents";
import {
  Clock,
  Footprints,
  Zap,
  MapPin,
  Thermometer,
  Heart,
  Flame,
  Calendar,
  Mountain,
  Cloud,
  RouteIcon,
  StickyNote,
  Play,
  Edit3,
  Activity,
  Trophy,
  Target,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "~/components/ui/ui";

function RunDetailPage() {
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
              Please sign in to view run details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <RunDetail />;
}

export const Route = createFileRoute("/runs/$runId")({
  component: RunDetailPage,
  errorComponent: ({ error }) => {
    const isRunNotFound = error.message?.includes("Run not found");

    if (isRunNotFound) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Run Not Found
                </h2>
                <p className="text-gray-600">
                  The run you're looking for doesn't exist or has been removed.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/runs" search={{ modal: false }}>
                  <Button className="flex-1 sm:flex-none">View Runs</Button>
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
  loader: async ({ context: { queryClient }, params: { runId } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Prefetch critical data
    const runPromise = queryClient.ensureQueryData(runQueries.detail(runId));
    const shoesPromise = queryClient.ensureQueryData(shoeQueries.list(false));

    // Wait for critical data
    await Promise.all([runPromise, shoesPromise]);

    // Prefetch related data in background (non-blocking)
    queryClient.prefetchQuery(runQueries.withShoes(20)).catch(() => {});

    return { runId, user };
  },
});

function RunDetail() {
  const { runId } = Route.useParams();
  const runQuery = useSuspenseQuery(runQueries.detail(runId));
  const shoesQuery = useSuspenseQuery(shoeQueries.list());

  const run = runQuery.data;
  const shoes = shoesQuery.data;
  const shoe = shoes.find((s) => s.id === run.shoeId);

  const runTypeLabel =
    RUN_TYPE_OPTIONS.find((opt) => opt.value === run.runType)?.label ||
    run.runType;
  const surfaceLabel =
    RUN_SURFACE_OPTIONS.find((opt) => opt.value === run.surface)?.label ||
    run.surface;
  const effortLabel =
    RUN_EFFORT_OPTIONS.find((opt) => opt.value === run.effort)?.label ||
    run.effort;

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "easy":
        return "text-green-600 bg-green-50";
      case "moderate":
        return "text-yellow-600 bg-yellow-50";
      case "hard":
        return "text-orange-600 bg-orange-50";
      case "very_hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRunTypeIcon = (type: string) => {
    switch (type) {
      case "easy":
        return <Play className="w-4 h-4" />;
      case "tempo":
        return <Zap className="w-4 h-4" />;
      case "interval":
        return <Activity className="w-4 h-4" />;
      case "long":
        return <Target className="w-4 h-4" />;
      case "race":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Footprints className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <BackToRuns />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/runs/$runId/edit"
              params={{ runId }}
              search={{ modal: false }}
            >
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Run
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Run Header Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 sm:p-8" shadow="medium">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  {getRunTypeIcon(run.runType)}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {runTypeLabel} Run
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(run.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
                    getEffortColor(run.effort || "moderate"),
                  )}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  {effortLabel}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CardGrid cols={3} className="gap-4 sm:gap-6">
            <MetricCard
              title="Distance"
              value={formatDistance(run.distance)}
              icon={<Footprints className="w-5 h-5" />}
              color="primary"
              className="transform transition-all duration-200 hover:scale-105"
            />
            <MetricCard
              title="Duration"
              value={run.duration ? formatDuration(run.duration) : "—"}
              icon={<Clock className="w-5 h-5" />}
              color="success"
              className="transform transition-all duration-200 hover:scale-105"
            />
            <MetricCard
              title="Pace"
              value={run.pace || "—"}
              subtitle="per mile"
              icon={<Zap className="w-5 h-5" />}
              color="warning"
              className="transform transition-all duration-200 hover:scale-105"
            />
          </CardGrid>
        </motion.div>

        {/* Performance & Environmental Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Performance Metrics */}
          {(run.heartRate || run.calories) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-4 sm:p-6" shadow="medium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Performance
                  </h2>
                </div>
                <div className="space-y-4">
                  {run.heartRate && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Heart Rate
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {run.heartRate} bpm
                      </span>
                    </div>
                  )}
                  {run.calories && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Calories
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {run.calories}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Environmental Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-4 sm:p-6" shadow="medium">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Environment
                </h2>
              </div>
              <div className="space-y-4">
                {run.weather && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Cloud className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Weather
                      </span>
                    </div>
                    <span className="text-sm text-gray-900 capitalize">
                      {run.weather}
                    </span>
                  </div>
                )}
                {run.temperature !== undefined && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Thermometer className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Temperature
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {run.temperature}°F
                    </span>
                  </div>
                )}
                {run.surface && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Surface
                      </span>
                    </div>
                    <span className="text-sm text-gray-900 capitalize">
                      {surfaceLabel}
                    </span>
                  </div>
                )}
                {run.elevation !== undefined && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mountain className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Elevation
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {run.elevation} ft
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Run Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-4 sm:p-6" shadow="medium">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                <RouteIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Run Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Shoe Used
                  </span>
                  {shoe ? (
                    <Link
                      to="/shoes/$shoeId"
                      params={{ shoeId: shoe.id }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      {shoe.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-500">Unknown</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">
                    Run Type
                  </span>
                  <span className="text-sm text-gray-900 capitalize">
                    {runTypeLabel}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {run.route && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">
                      Route
                    </span>
                    <span className="text-sm text-gray-900">{run.route}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notes */}
        {run.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="p-4 sm:p-6" shadow="medium">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-yellow-100 flex items-center justify-center">
                  <StickyNote className="w-6 h-6 text-yellow-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {run.notes}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
