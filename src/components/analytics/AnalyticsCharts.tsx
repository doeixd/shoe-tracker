import { useMemo, useState, useEffect, memo, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/ui";
import type {
  TimeSeriesData,
  ShoeAnalytics,
  SurfaceAnalytics,
  PaceZoneAnalytics,
  PersonalRecords,
  TimePeriod,
} from "~/lib/analytics";
import { formatDistance, formatDuration } from "~/types";

interface AnalyticsChartsProps {
  timeSeriesData: TimeSeriesData[];
  shoeAnalytics: ShoeAnalytics[];
  surfaceAnalytics: SurfaceAnalytics[];
  paceZoneAnalytics: PaceZoneAnalytics[];
  personalRecords: PersonalRecords;
  period: TimePeriod;
}

// Mobile-optimized chart wrapper
const MobileChartWrapper = memo(
  ({
    children,
    height = 320,
    mobileHeight = 250,
  }: {
    children: React.ReactElement;
    height?: number;
    mobileHeight?: number;
  }) => {
    const [isMobile, setIsMobile] = useState(false);

    const checkMobile = useCallback(() => {
      setIsMobile(window.innerWidth < 768);
    }, []);

    useEffect(() => {
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, [checkMobile]);

    return (
      <ResponsiveContainer
        width="100%"
        height={isMobile ? mobileHeight : height}
      >
        {children}
      </ResponsiveContainer>
    );
  },
);

MobileChartWrapper.displayName = "MobileChartWrapper";

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number | string;
  }>;
  label?: string;
  formatter?: (value: number | string, name: string) => string;
}

const CustomTooltip = memo(
  ({ active, payload, label, formatter }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div
        className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200/50 rounded-xl shadow-lg ring-1 ring-black/5"
        role="tooltip"
        aria-label={`Chart tooltip for ${label}`}
      >
        <p className="font-semibold text-gray-900 mb-2" id="tooltip-label">
          {label}
        </p>
        <div className="space-y-1" aria-labelledby="tooltip-label">
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color || "#gray" }}
                aria-hidden="true"
              />
              <span className="text-sm text-gray-900 font-medium">
                {entry.name || "Unknown"}:{" "}
                {formatter
                  ? formatter(entry.value || 0, entry.name || "")
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

CustomTooltip.displayName = "CustomTooltip";

// Chart Colors
const chartColors = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  lime: "#84cc16",
  orange: "#f97316",
};

const gradientColors = [
  "url(#colorPrimary)",
  "url(#colorSecondary)",
  "url(#colorAccent)",
  "url(#colorDanger)",
  "url(#colorPurple)",
  "url(#colorCyan)",
];

export const AnalyticsCharts = memo(
  ({
    timeSeriesData,
    shoeAnalytics,
    surfaceAnalytics,
    paceZoneAnalytics,
    personalRecords,
    period,
  }: AnalyticsChartsProps) => {
    // Format time series data for charts
    const chartData = useMemo(() => {
      return timeSeriesData.map((item) => ({
        ...item,
        formattedDate: format(new Date(item.date), "MMM dd"),
        distanceFormatted: formatDistance(item.distance),
        durationFormatted: formatDuration(item.duration),
      }));
    }, [timeSeriesData]);

    // Prepare shoe usage data
    const shoeUsageData = useMemo(() => {
      return shoeAnalytics.map((item, index) => ({
        name:
          item.shoe.name.length > 15
            ? item.shoe.name.substring(0, 12) + "..."
            : item.shoe.name,
        fullName: item.shoe.name,
        mileage: item.metrics.totalDistance,
        usage: item.usagePercentage,
        remaining: item.milesRemaining,
        costPerMile: item.costPerMile,
        color:
          Object.values(chartColors)[index % Object.values(chartColors).length],
      }));
    }, [shoeAnalytics]);

    // Surface distribution data
    const surfaceData = useMemo(() => {
      return surfaceAnalytics.map((item, index) => ({
        name: item.surface,
        value: item.percentage,
        distance: item.metrics.totalDistance,
        color:
          Object.values(chartColors)[index % Object.values(chartColors).length],
      }));
    }, [surfaceAnalytics]);

    // Pace zone data
    const paceZoneData = useMemo(() => {
      return paceZoneAnalytics.map((zone) => ({
        zone: zone.zone,
        percentage: zone.percentage,
        distance: zone.metrics.totalDistance,
        runs: zone.metrics.totalRuns,
        color: zone.color || Object.values(chartColors)[0],
      }));
    }, [paceZoneAnalytics]);

    // Define gradients
    const GradientDefs = () => (
      <defs>
        <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
          <stop
            offset="95%"
            stopColor={chartColors.primary}
            stopOpacity={0.1}
          />
        </linearGradient>
        <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="5%"
            stopColor={chartColors.secondary}
            stopOpacity={0.8}
          />
          <stop
            offset="95%"
            stopColor={chartColors.secondary}
            stopOpacity={0.1}
          />
        </linearGradient>
        <linearGradient id="colorAccent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.accent} stopOpacity={0.8} />
          <stop offset="95%" stopColor={chartColors.accent} stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="colorDanger" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.danger} stopOpacity={0.8} />
          <stop offset="95%" stopColor={chartColors.danger} stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.purple} stopOpacity={0.8} />
          <stop offset="95%" stopColor={chartColors.purple} stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColors.cyan} stopOpacity={0.8} />
          <stop offset="95%" stopColor={chartColors.cyan} stopOpacity={0.1} />
        </linearGradient>
      </defs>
    );

    return (
      <div className="space-y-6">
        {/* Distance Over Time - Full Width */}
        <Card className="col-span-full" variant="gradient" hover="lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 Running Activity Over Time
            </CardTitle>
            <CardDescription>
              Distance, duration, and cumulative progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MobileChartWrapper height={320} mobileHeight={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                role="img"
                aria-label="Running activity over time area chart"
              >
                <GradientDefs />
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload as any}
                      label={label}
                      formatter={(value: number | string, name: string) => {
                        if (name.includes("Distance")) return `${value} mi`;
                        if (name.includes("Duration")) return `${value} min`;
                        return String(value);
                      }}
                    />
                  )}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stackId="1"
                  stroke={chartColors.primary}
                  fill="url(#colorPrimary)"
                  strokeWidth={2}
                  name="Distance (mi)"
                />
                <Area
                  type="monotone"
                  dataKey="duration"
                  stackId="2"
                  stroke={chartColors.secondary}
                  fill="url(#colorSecondary)"
                  strokeWidth={2}
                  name="Duration (min)"
                />
              </AreaChart>
            </MobileChartWrapper>
          </CardContent>
        </Card>

        {/* Two Column Layout for Medium Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cumulative Progress */}
          <Card variant="default" hover="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Cumulative Progress
              </CardTitle>
              <CardDescription>
                Total distance and runs over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MobileChartWrapper height={280} mobileHeight={250}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  role="img"
                  aria-label="Cumulative progress line chart"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <CustomTooltip
                        active={active}
                        payload={payload as any}
                        label={label}
                        formatter={(value: number | string, name: string) => {
                          if (name.includes("Distance")) return `${value} mi`;
                          return String(value);
                        }}
                      />
                    )}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="cumulativeDistance"
                    stroke={chartColors.accent}
                    strokeWidth={3}
                    dot={{ fill: chartColors.accent, strokeWidth: 2, r: 5 }}
                    activeDot={{
                      r: 7,
                      stroke: chartColors.accent,
                      strokeWidth: 2,
                    }}
                    name="Total Distance (mi)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeRuns"
                    stroke={chartColors.danger}
                    strokeWidth={3}
                    dot={{ fill: chartColors.danger, strokeWidth: 2, r: 5 }}
                    activeDot={{
                      r: 7,
                      stroke: chartColors.danger,
                      strokeWidth: 2,
                    }}
                    name="Total Runs"
                  />
                </LineChart>
              </MobileChartWrapper>
            </CardContent>
          </Card>

          {/* Shoe Usage Chart */}
          <Card variant="default" hover="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👟 Shoe Usage
              </CardTitle>
              <CardDescription>
                Mileage and usage percentage by shoe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MobileChartWrapper height={280} mobileHeight={250}>
                <BarChart
                  data={shoeUsageData}
                  layout="horizontal"
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                  role="img"
                  aria-label="Shoe usage horizontal bar chart"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    opacity={0.5}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200/50 rounded-xl shadow-lg ring-1 ring-black/5">
                            <p className="font-semibold text-gray-900 mb-2">
                              {data.fullName}
                            </p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p>Mileage: {formatDistance(data.mileage)}</p>
                              <p>Usage: {data.usage.toFixed(1)}%</p>
                              <p>Remaining: {formatDistance(data.remaining)}</p>
                              {data.costPerMile > 0 && (
                                <p>Cost/mile: ${data.costPerMile.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="mileage" radius={[0, 6, 6, 0]} name="Mileage">
                    {shoeUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </MobileChartWrapper>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout for Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Surface Distribution */}
          <Card variant="default" hover="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏃🏼‍♀️ Surface Distribution
              </CardTitle>
              <CardDescription>Running surface breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <MobileChartWrapper height={280} mobileHeight={240}>
                <PieChart
                  role="img"
                  aria-label="Surface distribution pie chart"
                >
                  <Pie
                    data={surfaceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {surfaceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200/50 rounded-xl shadow-lg ring-1 ring-black/5">
                            <p className="font-semibold text-gray-900 mb-2">
                              {data.name}
                            </p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p>{data.value.toFixed(1)}% of runs</p>
                              <p>{formatDistance(data.distance)} total</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: "12px" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </MobileChartWrapper>
            </CardContent>
          </Card>

          {/* Pace Zones */}
          <Card variant="default" hover="lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚡ Pace Zone Distribution
              </CardTitle>
              <CardDescription>Training intensity breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <MobileChartWrapper height={280} mobileHeight={260}>
                <BarChart
                  data={paceZoneData}
                  margin={{ top: 10, right: 5, left: 0, bottom: 50 }}
                  role="img"
                  aria-label="Pace zone distribution bar chart"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="zone"
                    tick={{ fontSize: 9, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200/50 rounded-xl shadow-lg ring-1 ring-black/5">
                            <p className="font-semibold text-gray-900 mb-2">
                              {label}
                            </p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p>{data.percentage.toFixed(1)}% of runs</p>
                              <p>{formatDistance(data.distance)} total</p>
                              <p>{data.runs} runs</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    radius={[6, 6, 0, 0]}
                    name="Percentage"
                  >
                    {paceZoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </MobileChartWrapper>
            </CardContent>
          </Card>
        </div>

        {/* Personal Records - Full Width */}
        <Card className="col-span-full" variant="gradient" hover="lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Personal Records
            </CardTitle>
            <CardDescription>Your best performances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-sm opacity-90 mb-1">Longest Distance</div>
                <div className="text-2xl sm:text-3xl font-bold mb-2">
                  {formatDistance(personalRecords.longestDistance.value)}
                </div>
                <div className="text-xs opacity-75">
                  {personalRecords.longestDistance.date &&
                    format(
                      new Date(personalRecords.longestDistance.date),
                      "MMM dd, yyyy",
                    )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-sm opacity-90 mb-1">Fastest Pace</div>
                <div className="text-2xl sm:text-3xl font-bold mb-2">
                  {personalRecords.fastestPace.value > 0
                    ? `${Math.floor(personalRecords.fastestPace.value)}:${Math.round(
                        (personalRecords.fastestPace.value % 1) * 60,
                      )
                        .toString()
                        .padStart(2, "0")}/mi`
                    : "N/A"}
                </div>
                <div className="text-xs opacity-75">
                  {personalRecords.fastestPace.date &&
                    format(
                      new Date(personalRecords.fastestPace.date),
                      "MMM dd, yyyy",
                    )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-sm opacity-90 mb-1">Longest Duration</div>
                <div className="text-2xl sm:text-3xl font-bold mb-2">
                  {formatDuration(personalRecords.longestDuration.value)}
                </div>
                <div className="text-xs opacity-75">
                  {personalRecords.longestDuration.date &&
                    format(
                      new Date(personalRecords.longestDuration.date),
                      "MMM dd, yyyy",
                    )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-sm opacity-90 mb-1">Most Elevation</div>
                <div className="text-2xl sm:text-3xl font-bold mb-2">
                  {personalRecords.mostElevation.value > 0
                    ? `${personalRecords.mostElevation.value.toFixed(0)} ft`
                    : "N/A"}
                </div>
                <div className="text-xs opacity-75">
                  {personalRecords.mostElevation.date &&
                    format(
                      new Date(personalRecords.mostElevation.date),
                      "MMM dd, yyyy",
                    )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Best Week</div>
                <div className="text-xl font-bold text-gray-900 mb-2">
                  {formatDistance(personalRecords.bestWeek.distance)}
                </div>
                <div className="text-sm text-gray-500">
                  {personalRecords.bestWeek.runs} runs •{" "}
                  {personalRecords.bestWeek.startDate &&
                    format(
                      new Date(personalRecords.bestWeek.startDate),
                      "MMM dd",
                    )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Best Month</div>
                <div className="text-xl font-bold text-gray-900 mb-2">
                  {formatDistance(personalRecords.bestMonth.distance)}
                </div>
                <div className="text-sm text-gray-500">
                  {personalRecords.bestMonth.runs} runs •{" "}
                  {personalRecords.bestMonth.month}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);

AnalyticsCharts.displayName = "AnalyticsCharts";
