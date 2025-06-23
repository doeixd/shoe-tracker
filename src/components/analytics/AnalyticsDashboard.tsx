import { useState, useMemo, Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { runQueries, shoeQueries } from "~/queries";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { AnalyticsSummary } from "./AnalyticsSummary";
import {
  AnalyticsErrorBoundary,
  AnalyticsLoading,
  AnalyticsEmpty,
  ChartSkeleton,
  MetricCardSkeleton,
} from "./AnalyticsErrorBoundary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatCard,
  MetricCard,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
} from "../ui/ui";
import {
  generateTimeSeriesData,
  analyzeShoePerformance,
  analyzeSurfacePerformance,
  analyzePaceZones,
  calculatePersonalRecords,
  calculateRunningMetrics,
  filterRunsByDateRange,
  type TimePeriod,
} from "~/lib/analytics";
import type { RunType, RunSurface, RunEffort } from "~/types";
import { formatDistance, formatDuration } from "~/types";
import {
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  Target,
  Award,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  MapPin,
  AlertTriangle,
  Trophy,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";

export function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Fetch data
  const runsQuery = useSuspenseQuery(runQueries.withShoes());
  const shoesQuery = useSuspenseQuery(shoeQueries.list());

  const runs = runsQuery.data || [];
  const shoes = shoesQuery.data || [];

  // Filter runs by selected period
  const filteredRuns = useMemo(() => {
    // Extract just the run data without the shoe objects for analytics
    const plainRuns = runs.map(({ shoe, ...run }) => ({
      ...run,
      runType: run.runType as RunType,
      surface: run.surface as RunSurface | undefined,
      effort: run.effort as RunEffort | undefined,
    }));
    return filterRunsByDateRange(plainRuns, selectedPeriod);
  }, [runs, selectedPeriod]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    const metrics = calculateRunningMetrics(filteredRuns);
    const timeSeriesData = generateTimeSeriesData(filteredRuns, selectedPeriod);
    const shoeAnalytics = analyzeShoePerformance(shoes, filteredRuns);
    const surfaceAnalytics = analyzeSurfacePerformance(filteredRuns);
    const paceZoneAnalytics = analyzePaceZones(filteredRuns);
    const personalRecords = calculatePersonalRecords(
      runs.map(({ shoe, ...run }) => ({
        ...run,
        runType: run.runType as RunType,
        surface: run.surface as RunSurface | undefined,
        effort: run.effort as RunEffort | undefined,
      })),
    ); // Use all runs for PRs

    return {
      metrics,
      timeSeriesData,
      shoeAnalytics,
      surfaceAnalytics,
      paceZoneAnalytics,
      personalRecords,
    };
  }, [filteredRuns, shoes, runs]);

  // Calculate insights
  const insights = useMemo(() => {
    const avgPaceMinutes = analytics.metrics.avgPace;
    const avgPaceFormatted =
      avgPaceMinutes > 0
        ? `${Math.floor(avgPaceMinutes)}:${Math.round((avgPaceMinutes % 1) * 60)
            .toString()
            .padStart(2, "0")}/mi`
        : "N/A";

    const mostUsedShoe =
      analytics.shoeAnalytics.length > 0
        ? analytics.shoeAnalytics.reduce(
            (prev, current) =>
              current.metrics.totalDistance > prev.metrics.totalDistance
                ? current
                : prev,
            analytics.shoeAnalytics[0],
          )
        : null;

    const shoesNeedingReplacement = analytics.shoeAnalytics.filter(
      (shoe) => shoe.usagePercentage >= 90,
    );

    const shoesNearingReplacement = analytics.shoeAnalytics.filter(
      (shoe) => shoe.usagePercentage >= 70 && shoe.usagePercentage < 90,
    );

    return {
      avgPaceFormatted,
      mostUsedShoe,
      shoesNeedingReplacement,
      shoesNearingReplacement,
    };
  }, [analytics]);

  const periodOptions = [
    { value: "7d", label: "7 Days", emoji: "📅" },
    { value: "30d", label: "30 Days", emoji: "📊" },
    { value: "90d", label: "90 Days", emoji: "📈" },
    { value: "1y", label: "1 Year", emoji: "🗓️" },
    { value: "all", label: "All Time", emoji: "🌟" },
  ] as const;

  const getCurrentPeriodLabel = () => {
    const period = periodOptions.find((p) => p.value === selectedPeriod);
    return period ? `${period.emoji} ${period.label}` : "📊 30 Days";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-gradient-radial from-primary-100/20 to-transparent rounded-full animate-float" />
        <div
          className="absolute -bottom-60 -left-60 w-96 h-96 bg-gradient-radial from-blue-100/20 to-transparent rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-soft">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gradient">
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-gray-700 text-base sm:text-lg font-medium">
              Detailed insights into your running performance 📈
            </p>
          </div>

          {/* Enhanced Period Filter */}
          <div className="relative">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="w-full sm:w-auto justify-between min-w-[160px] bg-white border-gray-300 hover:border-primary-300 hover:bg-primary-50/50 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {getCurrentPeriodLabel()}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-600 transition-transform ${showPeriodDropdown ? "rotate-180" : ""}`}
              />
            </Button>

            {showPeriodDropdown && (
              <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-56 mt-2 bg-white border border-gray-200 rounded-2xl shadow-large z-10 overflow-hidden">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      setShowPeriodDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      selectedPeriod === option.value
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-gray-800 hover:text-primary-600"
                    }`}
                  >
                    <span className="text-base">{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-large hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {analytics.metrics.totalRuns}
            </div>
            <div className="text-sm text-blue-100">Total Runs</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-large hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatDistance(analytics.metrics.totalDistance)}
            </div>
            <div className="text-sm text-emerald-100">Total Distance</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-large hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <Minus className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {insights.avgPaceFormatted}
            </div>
            <div className="text-sm text-purple-100">Average Pace</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-large hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {formatDuration(analytics.metrics.totalDuration)}
            </div>
            <div className="text-sm text-amber-100">Total Time</div>
          </div>
        </div>

        {/* Alerts & Insights */}
        {(insights.shoesNeedingReplacement.length > 0 ||
          insights.shoesNearingReplacement.length > 0) && (
          <div className="space-y-4">
            {insights.shoesNeedingReplacement.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft border border-red-200 hover:shadow-medium transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">
                        Shoes Need Replacement
                      </h3>
                      <p className="text-sm text-red-700">
                        These shoes have reached their recommended mileage limit
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {insights.shoesNeedingReplacement.map((shoe) => (
                      <div
                        key={shoe.shoe.id}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100"
                      >
                        <div className="flex-1">
                          <span className="font-semibold text-red-900">
                            {shoe.shoe.name}
                          </span>
                          <p className="text-sm text-red-700">
                            {formatDistance(shoe.metrics.totalDistance)} /{" "}
                            {formatDistance(shoe.shoe.maxMileage || 500)}
                          </p>
                        </div>
                        <Badge variant="destructive" size="sm">
                          {shoe.usagePercentage.toFixed(0)}% used
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {insights.shoesNearingReplacement.length > 0 && (
              <div className="bg-white rounded-2xl shadow-soft border border-amber-200 hover:shadow-medium transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800">
                        Shoes Nearing Replacement
                      </h3>
                      <p className="text-sm text-amber-700">
                        Consider monitoring these shoes more closely
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {insights.shoesNearingReplacement.map((shoe) => (
                      <div
                        key={shoe.shoe.id}
                        className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100"
                      >
                        <div className="flex-1">
                          <span className="font-semibold text-amber-900">
                            {shoe.shoe.name}
                          </span>
                          <p className="text-sm text-amber-700">
                            {formatDistance(shoe.metrics.totalDistance)} /{" "}
                            {formatDistance(shoe.shoe.maxMileage || 500)}
                          </p>
                        </div>
                        <Badge variant="warning" size="sm">
                          {shoe.usagePercentage.toFixed(0)}% used
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Analytics Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
          <Tabs defaultValue="overview" value={activeTab}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto bg-gray-50 p-1">
              <TabsTrigger
                value="overview"
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                className="flex-col gap-2 py-4 px-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                active={activeTab === "performance"}
                onClick={() => setActiveTab("performance")}
                className="flex-col gap-2 py-4 px-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300"
              >
                <LineChart className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Performance</span>
              </TabsTrigger>
              <TabsTrigger
                value="shoes"
                active={activeTab === "shoes"}
                onClick={() => setActiveTab("shoes")}
                className="flex-col gap-2 py-4 px-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300"
              >
                <PieChart className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Equipment</span>
              </TabsTrigger>
              <TabsTrigger
                value="records"
                active={activeTab === "records"}
                onClick={() => setActiveTab("records")}
                className="flex-col gap-2 py-4 px-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-soft transition-all duration-300"
              >
                <Award className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Records</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="overview"
              active={activeTab === "overview"}
              className="space-y-6 p-6"
            >
              <div className="space-y-6 animate-slide-up">
                {/* Analytics Summary - Mobile Optimized */}
                <AnalyticsErrorBoundary>
                  <Suspense fallback={<MetricCardSkeleton />}>
                    {analytics.metrics.totalRuns === 0 ? (
                      <AnalyticsEmpty
                        title="No Running Data"
                        description="Start logging your runs to see detailed analytics and insights about your performance."
                        action={
                          <Button
                            variant="gradient"
                            size="lg"
                            className="flex items-center gap-2"
                            onClick={() => (window.location.href = "/runs/new")}
                          >
                            <Plus className="w-5 h-5" />
                            Log Your First Run
                          </Button>
                        }
                      />
                    ) : (
                      <AnalyticsSummary
                        metrics={analytics.metrics}
                        shoeAnalytics={analytics.shoeAnalytics}
                        surfaceAnalytics={analytics.surfaceAnalytics}
                        paceZoneAnalytics={analytics.paceZoneAnalytics}
                        personalRecords={analytics.personalRecords}
                        period={selectedPeriod}
                      />
                    )}
                  </Suspense>
                </AnalyticsErrorBoundary>

                {/* Detailed Charts */}
                {analytics.metrics.totalRuns > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        📊 Detailed Analytics
                      </h2>
                      <div className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                        {getCurrentPeriodLabel()}
                      </div>
                    </div>

                    <AnalyticsErrorBoundary>
                      <Suspense fallback={<ChartSkeleton height={320} />}>
                        <AnalyticsCharts
                          timeSeriesData={analytics.timeSeriesData}
                          shoeAnalytics={analytics.shoeAnalytics}
                          surfaceAnalytics={analytics.surfaceAnalytics}
                          paceZoneAnalytics={analytics.paceZoneAnalytics}
                          personalRecords={analytics.personalRecords}
                          period={selectedPeriod}
                        />
                      </Suspense>
                    </AnalyticsErrorBoundary>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="performance"
              active={activeTab === "performance"}
              className="space-y-6 p-6"
            >
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🏃‍♂️ Performance Analytics
                </h2>

                {analytics.metrics.totalRuns === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      No performance data available yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Zap className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {analytics.metrics.bestPace > 0
                                ? `${Math.floor(analytics.metrics.bestPace)}:${Math.round(
                                    (analytics.metrics.bestPace % 1) * 60,
                                  )
                                    .toString()
                                    .padStart(2, "0")}`
                                : "N/A"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Best Pace
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {insights.avgPaceFormatted}
                            </div>
                            <div className="text-sm text-gray-600">
                              Average Pace
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Target className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {analytics.metrics.bestPace > 0 &&
                              analytics.metrics.avgPace > 0
                                ? `±${Math.abs(analytics.metrics.avgPace - analytics.metrics.bestPace).toFixed(1)}`
                                : "N/A"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Pace Consistency
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="shoes"
              active={activeTab === "shoes"}
              className="space-y-6 p-6"
            >
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  👟 Equipment Analytics
                </h2>

                {analytics.shoeAnalytics.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No shoe data available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {analytics.shoeAnalytics.length}
                            </div>
                            <div className="text-sm text-gray-600">
                              Active Shoes
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              {insights.mostUsedShoe?.shoe.name
                                ? insights.mostUsedShoe.shoe.name.length > 15
                                  ? insights.mostUsedShoe.shoe.name.substring(
                                      0,
                                      15,
                                    ) + "..."
                                  : insights.mostUsedShoe.shoe.name
                                : "None"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Most Used
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {insights.shoesNeedingReplacement.length +
                                insights.shoesNearingReplacement.length}
                            </div>
                            <div className="text-sm text-gray-600">
                              Need Attention
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="records"
              active={activeTab === "records"}
              className="space-y-6 p-6"
            >
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  🏆 Personal Records
                </h2>

                {analytics.metrics.totalRuns === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No records available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-large">
                      <div className="text-3xl font-bold mb-2">
                        {formatDistance(
                          analytics.personalRecords.longestDistance.value,
                        )}
                      </div>
                      <div className="text-sm text-blue-100 mb-1">
                        Longest Distance
                      </div>
                      <div className="text-xs text-blue-200">
                        {analytics.personalRecords.longestDistance.date &&
                          new Date(
                            analytics.personalRecords.longestDistance.date,
                          ).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-large">
                      <div className="text-3xl font-bold mb-2">
                        {analytics.personalRecords.fastestPace.value > 0
                          ? `${Math.floor(analytics.personalRecords.fastestPace.value)}:${Math.round(
                              (analytics.personalRecords.fastestPace.value %
                                1) *
                                60,
                            )
                              .toString()
                              .padStart(2, "0")}`
                          : "N/A"}
                      </div>
                      <div className="text-sm text-green-100 mb-1">
                        Fastest Pace
                      </div>
                      <div className="text-xs text-green-200">
                        {analytics.personalRecords.fastestPace.date &&
                          new Date(
                            analytics.personalRecords.fastestPace.date,
                          ).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-large">
                      <div className="text-3xl font-bold mb-2">
                        {formatDuration(
                          analytics.personalRecords.longestDuration.value,
                        )}
                      </div>
                      <div className="text-sm text-purple-100 mb-1">
                        Longest Duration
                      </div>
                      <div className="text-xs text-purple-200">
                        {analytics.personalRecords.longestDuration.date &&
                          new Date(
                            analytics.personalRecords.longestDuration.date,
                          ).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-large">
                      <div className="text-3xl font-bold mb-2">
                        {analytics.personalRecords.mostElevation.value.toFixed(
                          0,
                        )}{" "}
                        ft
                      </div>
                      <div className="text-sm text-orange-100 mb-1">
                        Most Elevation
                      </div>
                      <div className="text-xs text-orange-200">
                        {analytics.personalRecords.mostElevation.date &&
                          new Date(
                            analytics.personalRecords.mostElevation.date,
                          ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
