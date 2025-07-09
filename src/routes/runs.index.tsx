import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  runQueries,
  shoeQueries,
  collectionQueries,
  statsQueries,
} from "~/queries";
import { requireAuth } from "~/utils/auth";
import { Loader } from "~/components/Loader";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import * as React from "react";
import {
  formatDistance,
  formatDuration,
  RUN_TYPE_OPTIONS,
  RUN_EFFORT_OPTIONS,
} from "~/types";
import { useState } from "react";
import { useAuth } from "~/components/AuthProvider";
import { useMobileDetection } from "~/hooks/useMobileDetection";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { RunForm } from "~/components/RunForm";
import { Button } from "~/components/FormComponents";
import { FormGrid } from "~/components/FormComponents";
import {
  Plus,
  Loader2,
  Calendar,
  MapPin,
  Thermometer,
  Heart,
  Zap,
  Play,
  Timer,
  Route as RouteIcon,
  Filter,
  SortAsc,
  Search,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Footprints,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import { PageHeader, PageContainer } from "~/components/PageHeader";
import {
  Card,
  MetricCard,
  FeatureCard,
  EmptyStateCard,
  CardGrid,
} from "~/components/ui/Cards";
import { cn } from "~/components/ui/ui";

function RunsPage() {
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
              Please sign in to access your runs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading runs...</p>
        </div>
      </div>
    }>
      <Runs />
    </React.Suspense>
  );
}

export const Route = createFileRoute("/runs/")({
  component: RunsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    // Start prefetching related data before the route loads
    const prefetchPromises = [
      queryClient.prefetchQuery({
        ...shoeQueries.list(false),
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        ...collectionQueries.list(),
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        ...statsQueries.overall(),
        staleTime: 1000 * 60 * 5,
      }),
    ];

    // Fire and forget - don't block navigation
    Promise.all(prefetchPromises).catch(() => {});

    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Preload runs and related data in parallel
    const runsPromise = queryClient.ensureQueryData(runQueries.withShoes(50));
    const shoesPromise = queryClient.ensureQueryData(shoeQueries.list(false));

    // Wait for critical data
    await Promise.all([runsPromise, shoesPromise]);

    return { user };
  },
  // Route-level caching configuration
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  shouldReload: false, // Don't reload if data is fresh
});

// Custom Select Component matching shoes page style
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  icon?: React.ReactNode;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  icon,
}: CustomSelectProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400">
        {icon}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-12 rounded-2xl border border-gray-200 bg-white text-gray-900",
          "focus:outline-none focus:ring-0 focus:border-primary-400 focus:shadow-glow",
          "hover:border-gray-300 transition-all duration-300 ease-out",
          "appearance-none cursor-pointer",
          // WebKit-specific styles to ensure no browser arrow
          "[-webkit-appearance:none] [-moz-appearance:none]",
          // Remove default select styling
          "[&::-ms-expand]:hidden",
          icon ? "pl-12 pr-12" : "pl-4 pr-12",
        )}
        style={{
          backgroundImage: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
      </div>
    </div>
  );
}

function Runs() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/runs/" });
  const { isMobile } = useMobileDetection();
  const { isFirstVisit } = useFirstVisit();
  const runsQuery = useSuspenseQuery(runQueries.withShoes(100));
  const shoesQuery = useSuspenseQuery(shoeQueries.list());
  const collectionsQuery = useSuspenseQuery(collectionQueries.list());

  const [selectedShoe, setSelectedShoe] = useState<string>("");
  const [selectedRunType, setSelectedRunType] = useState<string>("");
  const [selectedEffort, setSelectedEffort] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "date" | "distance" | "pace" | "duration"
  >("date");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">(
    "all",
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const runs = runsQuery.data;
  const shoes = shoesQuery.data;
  const collections = collectionsQuery.data;

  // Filter runs
  let filteredRuns = runs;

  if (selectedShoe) {
    filteredRuns = filteredRuns.filter((run) => run.shoeId === selectedShoe);
  }

  if (selectedRunType) {
    filteredRuns = filteredRuns.filter(
      (run) => run.runType === selectedRunType,
    );
  }

  if (selectedEffort) {
    filteredRuns = filteredRuns.filter((run) => run.effort === selectedEffort);
  }

  // Date range filter
  if (dateRange !== "all") {
    const now = new Date();
    const cutoff = new Date();

    switch (dateRange) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    filteredRuns = filteredRuns.filter((run) => new Date(run.date) >= cutoff);
  }

  // Sort runs
  filteredRuns.sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case "distance":
        return b.distance - a.distance;
      case "duration":
        return (b.duration || 0) - (a.duration || 0);
      case "pace":
        if (!a.pace || !b.pace) return 0;
        const aPaceMinutes =
          parseFloat(a.pace.split(":")[0]) +
          parseFloat(a.pace.split(":")[1]) / 60;
        const bPaceMinutes =
          parseFloat(b.pace.split(":")[0]) +
          parseFloat(b.pace.split(":")[1]) / 60;
        return aPaceMinutes - bPaceMinutes;
      default:
        return 0;
    }
  });

  // Calculate summary stats
  const totalDistance = filteredRuns.reduce(
    (sum, run) => sum + run.distance,
    0,
  );
  const totalDuration = filteredRuns.reduce(
    (sum, run) => sum + (run.duration || 0),
    0,
  );
  const avgDistance =
    filteredRuns.length > 0 ? totalDistance / filteredRuns.length : 0;
  const avgPace = (() => {
    const runsWithPace = filteredRuns.filter((run) => run.pace);
    if (runsWithPace.length === 0) return null;

    const totalPaceMinutes = runsWithPace.reduce((sum, run) => {
      const [minutes, seconds] = run.pace!.split(":").map(Number);
      return sum + minutes + seconds / 60;
    }, 0);

    const avgMinutes = totalPaceMinutes / runsWithPace.length;
    const minutes = Math.floor(avgMinutes);
    const seconds = Math.round((avgMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  })();

  // Get effort color
  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-orange-100 text-orange-800";
      case "very_hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get run type icon
  const getRunTypeIcon = (runType: string) => {
    switch (runType) {
      case "outdoor":
        return <Activity className="w-4 h-4" />;
      case "treadmill":
        return <Timer className="w-4 h-4" />;
      case "track":
        return <Target className="w-4 h-4" />;
      case "trail":
        return <RouteIcon className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Runs"
        description="Track your running sessions and monitor shoe performance"
        actions={
          <Button
            onClick={() => {
              if (isMobile) {
                navigate({
                  to: "/runs",
                  search: {
                    modal: true,
                  },
                });
              } else {
                navigate({ to: "/runs/new", search: { modal: false } });
              }
            }}
            icon={<Plus className="w-5 h-5" />}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl px-6 py-3 font-semibold"
          >
            Log Run
          </Button>
        }
      />

      {/* Modal for Adding Run - Only show on mobile */}
      {isMobile && (
        <FormModalSheet
          isOpen={search.modal}
          onClose={() => {
            navigate({ to: "/runs", search: { modal: false } });
          }}
          title="Log New Run"
          description="Record your latest running session"
          formHeight="full"
        >
          <RunForm
            isModal={true}
            onSuccess={(runId) => {
              navigate({ to: "/runs", search: { modal: false } });
              setTimeout(() => {
                navigate({
                  to: "/runs/$runId",
                  params: { runId },
                  search: {},
                });
              }, 100);
            }}
            onCancel={() => {
              navigate({ to: "/runs", search: { modal: false } });
            }}
          />
        </FormModalSheet>
      )}

      {/* Stats */}
      <motion.div
        {...getAnimationProps(isFirstVisit, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.1 },
        })}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Total Runs"
            value={filteredRuns.length}
            subtitle="Sessions logged"
            icon={<Activity className="w-6 h-6" />}
            color="primary"
          />
          <MetricCard
            title="Total Distance"
            value={formatDistance(totalDistance)}
            subtitle="Miles logged"
            icon={<RouteIcon className="w-6 h-6" />}
            color="success"
          />
          <MetricCard
            title="Avg Distance"
            value={formatDistance(avgDistance)}
            subtitle="Per run"
            icon={<Timer className="w-6 h-6" />}
            color="warning"
          />
          <MetricCard
            title="Avg Pace"
            value={avgPace || "N/A"}
            subtitle="Per mile"
            icon={<TrendingUp className="w-6 h-6" />}
            color="neutral"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        {...getAnimationProps(isFirstVisit, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.2 },
        })}
        className="bg-gradient-to-br from-white via-gray-50/50 to-white rounded-3xl shadow-medium border border-gray-100/80 p-4 sm:p-6"
      >
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className={`flex items-center justify-between w-full gap-3 ${filtersExpanded ? "mb-6" : ""} hover:bg-gray-50/50 rounded-2xl p-2 -m-2 transition-colors`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <Filter className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Filters & Sorting
            </h3>
          </div>
          {filtersExpanded ? (
            <ChevronUp className="w-6 h-6 text-gray-600" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-600" />
          )}
        </button>

        {filtersExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <CustomSelect
                value={dateRange}
                onChange={(value) => setDateRange(value as any)}
                options={[
                  { value: "all", label: "All Time" },
                  { value: "week", label: "Last Week" },
                  { value: "month", label: "Last Month" },
                  { value: "year", label: "Last Year" },
                ]}
                placeholder="Date Range"
                icon={<Calendar className="w-5 h-5" />}
              />

              <CustomSelect
                value={selectedShoe}
                onChange={setSelectedShoe}
                options={[
                  { value: "", label: "All Shoes" },
                  ...shoes.map((shoe) => ({
                    value: shoe.id,
                    label: shoe.name || "Unnamed Shoe",
                  })),
                ]}
                placeholder="Select Shoe"
                icon={<Footprints className="w-5 h-5" />}
              />

              <CustomSelect
                value={selectedRunType}
                onChange={setSelectedRunType}
                options={[
                  { value: "", label: "All Types" },
                  ...RUN_TYPE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
                placeholder="Run Type"
                icon={<Activity className="w-5 h-5" />}
              />

              <CustomSelect
                value={selectedEffort}
                onChange={setSelectedEffort}
                options={[
                  { value: "", label: "All Efforts" },
                  ...RUN_EFFORT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })),
                ]}
                placeholder="Effort Level"
                icon={<Heart className="w-5 h-5" />}
              />

              <CustomSelect
                value={sortBy}
                onChange={(value) => setSortBy(value as any)}
                options={[
                  { value: "date", label: "Date" },
                  { value: "distance", label: "Distance" },
                  { value: "duration", label: "Duration" },
                  { value: "pace", label: "Pace" },
                ]}
                placeholder="Sort By"
                icon={<SortAsc className="w-5 h-5" />}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Runs Grid */}
      <div>
        {filteredRuns.length === 0 ? (
          <EmptyStateCard
            title="No runs found"
            description={
              selectedShoe ||
              selectedRunType ||
              selectedEffort ||
              dateRange !== "all"
                ? "Try adjusting your filters to see more runs"
                : "Start logging your runs to see them here"
            }
            icon={<Play className="w-8 h-8 text-gray-400" />}
            actionLabel={
              selectedShoe ||
              selectedRunType ||
              selectedEffort ||
              dateRange !== "all"
                ? "Clear Filters"
                : "Log Your First Run"
            }
            onAction={() => {
              if (
                selectedShoe ||
                selectedRunType ||
                selectedEffort ||
                dateRange !== "all"
              ) {
                // Clear filters
                setSelectedShoe("");
                setSelectedRunType("");
                setSelectedEffort("");
                setDateRange("all");
              } else {
                // Add new run
                if (isMobile) {
                  navigate({
                    to: "/runs",
                    search: {
                      modal: true,
                    },
                  });
                } else {
                  navigate({ to: "/runs/new", search: { modal: false } });
                }
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredRuns.map((run, index) => {
              const shoe = shoes.find((s) => s.id === run.shoeId);
              const runTypeOption = RUN_TYPE_OPTIONS.find(
                (opt) => opt.value === run.runType,
              );
              const effortOption = RUN_EFFORT_OPTIONS.find(
                (opt) => opt.value === run.effort,
              );

              return (
                <div key={run.id} className="h-full">
                  <FeatureCard
                    title={new Date(run.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    description={`${formatDistance(run.distance)} • ${
                      run.duration ? formatDuration(run.duration) : "No time"
                    }`}
                    onClick={() =>
                      navigate({
                        to: "/runs/$runId",
                        params: { runId: run.id },
                      })
                    }
                    className={cn(
                      "h-full transition-all duration-300 cursor-pointer hover:shadow-large hover:scale-[1.02] active:scale-[0.98]",
                    )}
                  >
                    <div className="space-y-4">
                      {/* Run Type and Effort */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRunTypeIcon(run.runType)}
                          <span className="text-sm font-medium text-gray-700">
                            {runTypeOption?.label || run.runType}
                          </span>
                        </div>
                        {run.effort && (
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              getEffortColor(run.effort),
                            )}
                          >
                            {effortOption?.label || run.effort}
                          </span>
                        )}
                      </div>

                      {/* Pace and Shoe */}
                      <div className="space-y-3">
                        {run.pace && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pace
                            </span>
                            <span className="font-semibold text-gray-900">
                              {run.pace} /mi
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Footprints className="w-3 h-3" />
                            Shoe
                          </span>
                          <span className="font-medium text-gray-900">
                            {shoe?.name || "Unknown"}
                          </span>
                        </div>
                      </div>

                      {/* Weather and Route */}
                      {(run.temperature || run.route) && (
                        <div className="pt-3 border-t border-gray-100">
                          {run.temperature && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Thermometer className="w-3 h-3" />
                              <span>{run.temperature}°F</span>
                            </div>
                          )}
                          {run.route && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{run.route}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes Preview */}
                      {run.notes && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {run.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </FeatureCard>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
