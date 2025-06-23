import { useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from "../ui/ui";
import type {
  ShoeAnalytics,
  SurfaceAnalytics,
  PaceZoneAnalytics,
  PersonalRecords,
  RunningMetrics,
} from "~/lib/analytics";
import { formatDistance, formatDuration } from "~/types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Activity,
  Clock,
  MapPin,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface AnalyticsSummaryProps {
  metrics: RunningMetrics;
  shoeAnalytics: ShoeAnalytics[];
  surfaceAnalytics: SurfaceAnalytics[];
  paceZoneAnalytics: PaceZoneAnalytics[];
  personalRecords: PersonalRecords;
  period: string;
}

interface TrendData {
  value: number;
  trend: "up" | "down" | "neutral";
  change: string;
  isGood: boolean;
}

export function AnalyticsSummary({
  metrics,
  shoeAnalytics,
  surfaceAnalytics,
  paceZoneAnalytics,
  personalRecords,
  period,
}: AnalyticsSummaryProps) {
  // Calculate insights and trends
  const insights = useMemo(() => {
    const mostUsedShoe = shoeAnalytics.length > 0
      ? shoeAnalytics.reduce((prev, current) =>
          current.metrics.totalDistance > prev.metrics.totalDistance ? current : prev
        )
      : null;

    const favoritesSurface = surfaceAnalytics.length > 0
      ? surfaceAnalytics.reduce((prev, current) =>
          current.percentage > prev.percentage ? current : prev
        )
      : null;

    const dominantPaceZone = paceZoneAnalytics.length > 0
      ? paceZoneAnalytics.reduce((prev, current) =>
          current.percentage > prev.percentage ? current : prev
        )
      : null;

    const shoesAtRisk = shoeAnalytics.filter(shoe => shoe.usagePercentage >= 80);
    const averagePace = metrics.avgPace > 0
      ? `${Math.floor(metrics.avgPace)}:${Math.round(
          (metrics.avgPace % 1) * 60
        ).toString().padStart(2, "0")}/mi`
      : "N/A";

    const weeklyAverage = period === "30d" ? (metrics.totalDistance / 4.3).toFixed(1) :
                         period === "90d" ? (metrics.totalDistance / 12.9).toFixed(1) :
                         period === "1y" ? (metrics.totalDistance / 52).toFixed(1) :
                         "N/A";

    return {
      mostUsedShoe,
      favoritesSurface,
      dominantPaceZone,
      shoesAtRisk,
      averagePace,
      weeklyAverage,
    };
  }, [metrics, shoeAnalytics, surfaceAnalytics, paceZoneAnalytics, period]);

  // Generate trend data
  const trendData: TrendData[] = useMemo(() => [
    {
      value: metrics.totalRuns,
      trend: metrics.totalRuns > 0 ? "up" : "neutral",
      change: `${metrics.totalRuns} runs`,
      isGood: true,
    },
    {
      value: metrics.totalDistance,
      trend: metrics.totalDistance > 0 ? "up" : "neutral",
      change: formatDistance(metrics.totalDistance),
      isGood: true,
    },
    {
      value: metrics.avgPace,
      trend: "neutral",
      change: insights.averagePace,
      isGood: true,
    },
  ], [metrics, insights.averagePace]);

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "neutral" }) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-danger-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Runs</p>
                <p className="text-xl sm:text-2xl font-bold">{metrics.totalRuns}</p>
              </div>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" />
            </div>
            <div className="flex items-center mt-2 text-xs text-blue-100">
              <TrendIcon trend="up" />
              <span className="ml-1">This {period}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success-500 to-success-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-success-100 text-xs sm:text-sm font-medium">Distance</p>
                <p className="text-xl sm:text-2xl font-bold">{formatDistance(metrics.totalDistance)}</p>
              </div>
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-success-200" />
            </div>
            <div className="flex items-center mt-2 text-xs text-success-100">
              <TrendIcon trend="up" />
              <span className="ml-1">~{insights.weeklyAverage} mi/week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-purple-100 text-xs sm:text-sm font-medium">Avg Pace</p>
                <p className="text-xl sm:text-2xl font-bold">{insights.averagePace}</p>
              </div>
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200" />
            </div>
            <div className="flex items-center mt-2 text-xs text-purple-100">
              <TrendIcon trend="neutral" />
              <span className="ml-1">Overall average</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-orange-100 text-xs sm:text-sm font-medium">Total Time</p>
                <p className="text-xl sm:text-2xl font-bold">{formatDuration(metrics.totalDuration)}</p>
              </div>
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-orange-200" />
            </div>
            <div className="flex items-center mt-2 text-xs text-orange-100">
              <TrendIcon trend="up" />
              <span className="ml-1">Time invested</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Equipment Insights */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              👟 Equipment Insights
            </CardTitle>
            <CardDescription>Your running gear analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.mostUsedShoe && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Most Used Shoe</p>
                  <p className="text-sm text-gray-600">
                    {insights.mostUsedShoe.shoe.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistance(insights.mostUsedShoe.metrics.totalDistance)} •
                    {insights.mostUsedShoe.metrics.totalRuns} runs
                  </p>
                </div>
                <Badge variant="secondary" size="sm">
                  {insights.mostUsedShoe.usagePercentage.toFixed(0)}%
                </Badge>
              </div>
            )}

            {insights.shoesAtRisk.length > 0 && (
              <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning-600" />
                  <p className="font-medium text-warning-800">
                    {insights.shoesAtRisk.length} shoe{insights.shoesAtRisk.length > 1 ? 's' : ''} need attention
                  </p>
                </div>
                <div className="space-y-2">
                  {insights.shoesAtRisk.slice(0, 2).map((shoe) => (
                    <div key={shoe.shoe.id} className="flex items-center justify-between">
                      <span className="text-sm text-warning-800 truncate">
                        {shoe.shoe.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={shoe.usagePercentage}
                          max={100}
                          variant={shoe.usagePercentage >= 90 ? "danger" : "warning"}
                          size="sm"
                          className="w-16"
                        />
                        <span className="text-xs text-warning-700 min-w-[35px]">
                          {shoe.usagePercentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              📈 Performance Insights
            </CardTitle>
            <CardDescription>Your running patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.favoritesSurface && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Favorite Surface</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {insights.favoritesSurface.surface}
                  </p>
                  <p className="text-xs text-gray-500">
                    {insights.favoritesSurface.percentage.toFixed(1)}% of runs
                  </p>
                </div>
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
            )}

            {insights.dominantPaceZone && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Training Zone</p>
                  <p className="text-sm text-gray-600">
                    {insights.dominantPaceZone.zone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {insights.dominantPaceZone.percentage.toFixed(1)}% of runs
                  </p>
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: insights.dominantPaceZone.color }}
                />
              </div>
            )}

            <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary-600" />
                <p className="font-medium text-primary-800">Recent Achievement</p>
              </div>
              <div className="text-sm text-primary-700">
                <p>
                  Longest run: {formatDistance(personalRecords.longestDistance.value)}
                </p>
                {personalRecords.longestDistance.date && (
                  <p className="text-xs text-primary-600 mt-1">
                    {format(new Date(personalRecords.longestDistance.date), "MMM dd, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200/50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                💡 Quick Insights for {period === "7d" ? "This Week" :
                                      period === "30d" ? "This Month" :
                                      period === "90d" ? "Last 3 Months" :
                                      period === "1y" ? "This Year" : "All Time"}
              </h3>
              <p className="text-sm text-gray-600">
                {metrics.totalRuns === 0
                  ? "No runs recorded for this period. Time to lace up!"
                  : insights.weeklyAverage !== "N/A"
                  ? `You're averaging ${insights.weeklyAverage} miles per week`
                  : `You've completed ${metrics.totalRuns} runs totaling ${formatDistance(metrics.totalDistance)}`
                }
              </p>
            </div>

            {metrics.totalRuns > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-success-600">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span>Active</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {Math.round(metrics.totalDistance / metrics.totalRuns * 10) / 10} mi avg
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
