import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parseISO,
  isWithinInterval,
} from "date-fns";
import type { Run, Shoe, Collection, ShoeWithStats } from "~/types";

// Time period types
export type TimePeriod = "7d" | "30d" | "90d" | "1y" | "all";
export type GroupBy = "day" | "week" | "month" | "year";

// Analytics data types
export interface RunningMetrics {
  totalDistance: number;
  totalDuration: number;
  totalRuns: number;
  avgDistance: number;
  avgDuration: number;
  avgPace: number;
  bestPace: number;
  longestRun: number;
  longestDuration: number;
  totalElevation: number;
}

export interface TimeSeriesData {
  date: string;
  distance: number;
  duration: number;
  runs: number;
  avgPace: number;
  cumulativeDistance: number;
  cumulativeDuration: number;
  cumulativeRuns: number;
}

export interface ShoeAnalytics {
  shoe: Shoe;
  metrics: RunningMetrics;
  usagePercentage: number;
  milesRemaining: number;
  estimatedRetirement: Date | null;
  costPerMile: number;
  efficiency: number;
}

export interface SurfaceAnalytics {
  surface: string;
  metrics: RunningMetrics;
  percentage: number;
}

export interface PaceZoneAnalytics {
  zone: string;
  minPace: number;
  maxPace: number;
  metrics: RunningMetrics;
  percentage: number;
  color: string;
}

export interface PersonalRecords {
  longestDistance: { value: number; date: string; runId: string };
  fastestPace: { value: number; date: string; runId: string; distance: number };
  longestDuration: { value: number; date: string; runId: string };
  mostElevation: { value: number; date: string; runId: string };
  bestWeek: { distance: number; runs: number; startDate: string };
  bestMonth: { distance: number; runs: number; month: string };
}

export interface GoalProgress {
  type: "distance" | "runs" | "duration";
  target: number;
  current: number;
  percentage: number;
  timeframe: "week" | "month" | "year";
  onTrack: boolean;
  projectedCompletion: number;
}

// Utility functions
export function getDateRange(period: TimePeriod): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (period) {
    case "7d":
      start = subDays(end, 7);
      break;
    case "30d":
      start = subDays(end, 30);
      break;
    case "90d":
      start = subDays(end, 90);
      break;
    case "1y":
      start = subDays(end, 365);
      break;
    case "all":
      start = new Date(2020, 0, 1); // Arbitrary early date
      break;
    default:
      start = subDays(end, 30);
  }

  return { start, end };
}

export function filterRunsByDateRange(runs: Run[], period: TimePeriod): Run[] {
  if (period === "all") return runs;

  const { start, end } = getDateRange(period);

  return runs.filter((run) => {
    const runDate = parseISO(run.date);
    return isWithinInterval(runDate, { start, end });
  });
}

export function calculateRunningMetrics(runs: Run[]): RunningMetrics {
  if (runs.length === 0) {
    return {
      totalDistance: 0,
      totalDuration: 0,
      totalRuns: 0,
      avgDistance: 0,
      avgDuration: 0,
      avgPace: 0,
      bestPace: 0,
      longestRun: 0,
      longestDuration: 0,
      totalElevation: 0,
    };
  }

  const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
  const totalDuration = runs.reduce((sum, run) => sum + (run.duration || 0), 0);
  const totalElevation = runs.reduce(
    (sum, run) => sum + (run.elevation || 0),
    0,
  );

  const runsWithPace = runs.filter((run) => run.pace);
  const paces = runsWithPace.map((run) => parsePaceToMinutes(run.pace!));

  const avgPace =
    paces.length > 0
      ? paces.reduce((sum, pace) => sum + pace, 0) / paces.length
      : 0;
  const bestPace = paces.length > 0 ? Math.min(...paces) : 0;

  return {
    totalDistance,
    totalDuration,
    totalRuns: runs.length,
    avgDistance: totalDistance / runs.length,
    avgDuration: totalDuration / runs.length,
    avgPace,
    bestPace,
    longestRun: Math.max(...runs.map((run) => run.distance)),
    longestDuration: Math.max(...runs.map((run) => run.duration || 0)),
    totalElevation,
  };
}

export function generateTimeSeriesData(
  runs: Run[],
  period: TimePeriod,
  groupBy: GroupBy = "day",
): TimeSeriesData[] {
  const { start, end } = getDateRange(period);
  const filteredRuns = filterRunsByDateRange(runs, period);

  let intervals: Date[];
  let formatString: string;

  switch (groupBy) {
    case "day":
      intervals = eachDayOfInterval({ start, end });
      formatString = "yyyy-MM-dd";
      break;
    case "week":
      intervals = eachWeekOfInterval({ start, end });
      formatString = "yyyy-MM-dd";
      break;
    case "month":
      intervals = eachMonthOfInterval({ start, end });
      formatString = "yyyy-MM";
      break;
    case "year":
      intervals = eachMonthOfInterval({ start, end }).filter(
        (_: Date, index: number) => index % 12 === 0,
      );
      formatString = "yyyy";
      break;
    default:
      intervals = eachDayOfInterval({ start, end });
      formatString = "yyyy-MM-dd";
  }

  let cumulativeDistance = 0;
  let cumulativeDuration = 0;
  let cumulativeRuns = 0;

  return intervals.map((intervalDate) => {
    const intervalStart =
      groupBy === "week"
        ? startOfWeek(intervalDate)
        : groupBy === "month"
          ? startOfMonth(intervalDate)
          : groupBy === "year"
            ? startOfYear(intervalDate)
            : intervalDate;
    const intervalEnd =
      groupBy === "week"
        ? endOfWeek(intervalDate)
        : groupBy === "month"
          ? endOfMonth(intervalDate)
          : groupBy === "year"
            ? endOfYear(intervalDate)
            : intervalDate;

    const intervalRuns = filteredRuns.filter((run) => {
      const runDate = parseISO(run.date);
      return isWithinInterval(runDate, {
        start: intervalStart,
        end: intervalEnd,
      });
    });

    const distance = intervalRuns.reduce((sum, run) => sum + run.distance, 0);
    const duration = intervalRuns.reduce(
      (sum, run) => sum + (run.duration || 0),
      0,
    );
    const runs = intervalRuns.length;

    const paces = intervalRuns
      .filter((run) => run.pace)
      .map((run) => parsePaceToMinutes(run.pace!));
    const avgPace =
      paces.length > 0
        ? paces.reduce((sum, pace) => sum + pace, 0) / paces.length
        : 0;

    cumulativeDistance += distance;
    cumulativeDuration += duration;
    cumulativeRuns += runs;

    return {
      date: format(intervalDate, formatString),
      distance,
      duration,
      runs,
      avgPace,
      cumulativeDistance,
      cumulativeDuration,
      cumulativeRuns,
    };
  });
}

export function analyzeShoePerformance(
  shoes: Shoe[],
  runs: Run[],
): ShoeAnalytics[] {
  return shoes.map((shoe) => {
    const shoeRuns = runs.filter((run) => run.shoeId === shoe.id);
    const metrics = calculateRunningMetrics(shoeRuns);

    const currentMileage = metrics.totalDistance;
    const usagePercentage = (currentMileage / shoe.maxMileage) * 100;
    const milesRemaining = Math.max(0, shoe.maxMileage - currentMileage);

    // Estimate retirement date based on current usage pattern
    const avgWeeklyMileage = getAverageWeeklyMileage(shoeRuns);
    const weeksToRetirement =
      avgWeeklyMileage > 0 ? milesRemaining / avgWeeklyMileage : null;
    const estimatedRetirement = weeksToRetirement
      ? new Date(Date.now() + weeksToRetirement * 7 * 24 * 60 * 60 * 1000)
      : null;

    // Calculate cost per mile
    const costPerMile =
      shoe.purchasePrice && currentMileage > 0
        ? shoe.purchasePrice / currentMileage
        : 0;

    // Calculate efficiency (distance per run)
    const efficiency =
      metrics.totalRuns > 0 ? metrics.totalDistance / metrics.totalRuns : 0;

    return {
      shoe,
      metrics,
      usagePercentage,
      milesRemaining,
      estimatedRetirement,
      costPerMile,
      efficiency,
    };
  });
}

export function analyzeSurfacePerformance(runs: Run[]): SurfaceAnalytics[] {
  const surfaceGroups = groupBy(runs, "surface");
  const totalRuns = runs.length;

  return Object.entries(surfaceGroups).map(([surface, surfaceRuns]) => ({
    surface: surface || "Unknown",
    metrics: calculateRunningMetrics(surfaceRuns),
    percentage: (surfaceRuns.length / totalRuns) * 100,
  }));
}

export function analyzePaceZones(runs: Run[]): PaceZoneAnalytics[] {
  const runsWithPace = runs.filter((run) => run.pace);
  if (runsWithPace.length === 0) return [];

  const paces = runsWithPace.map((run) => parsePaceToMinutes(run.pace!));
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = maxPace - minPace;

  const zones = [
    {
      zone: "Very Fast",
      min: minPace,
      max: minPace + range * 0.2,
      color: "#ef4444",
    },
    {
      zone: "Fast",
      min: minPace + range * 0.2,
      max: minPace + range * 0.4,
      color: "#f97316",
    },
    {
      zone: "Moderate",
      min: minPace + range * 0.4,
      max: minPace + range * 0.6,
      color: "#eab308",
    },
    {
      zone: "Easy",
      min: minPace + range * 0.6,
      max: minPace + range * 0.8,
      color: "#22c55e",
    },
    {
      zone: "Recovery",
      min: minPace + range * 0.8,
      max: maxPace,
      color: "#3b82f6",
    },
  ];

  return zones.map((zone) => {
    const zoneRuns = runsWithPace.filter((run) => {
      const pace = parsePaceToMinutes(run.pace!);
      return pace >= zone.min && pace <= zone.max;
    });

    return {
      zone: zone.zone,
      minPace: zone.min,
      maxPace: zone.max,
      metrics: calculateRunningMetrics(zoneRuns),
      percentage: (zoneRuns.length / runsWithPace.length) * 100,
      color: zone.color,
    };
  });
}

export function calculatePersonalRecords(runs: Run[]): PersonalRecords {
  if (runs.length === 0) {
    return {
      longestDistance: { value: 0, date: "", runId: "" },
      fastestPace: { value: 0, date: "", runId: "", distance: 0 },
      longestDuration: { value: 0, date: "", runId: "" },
      mostElevation: { value: 0, date: "", runId: "" },
      bestWeek: { distance: 0, runs: 0, startDate: "" },
      bestMonth: { distance: 0, runs: 0, month: "" },
    };
  }

  // Longest distance
  const longestRun = runs.reduce((max, run) =>
    run.distance > max.distance ? run : max,
  );

  // Fastest pace (for runs > 1 mile to avoid sprint outliers)
  const eligibleRuns = runs.filter((run) => run.pace && run.distance >= 1);
  const fastestRun = eligibleRuns.reduce((fastest, run) => {
    const currentPace = parsePaceToMinutes(run.pace!);
    const fastestPace = parsePaceToMinutes(fastest.pace!);
    return currentPace < fastestPace ? run : fastest;
  }, eligibleRuns[0] || runs[0]);

  // Longest duration
  const longestDurationRun = runs.reduce((max, run) =>
    (run.duration || 0) > (max.duration || 0) ? run : max,
  );

  // Most elevation
  const mostElevationRun = runs.reduce((max, run) =>
    (run.elevation || 0) > (max.elevation || 0) ? run : max,
  );

  // Best week and month
  const weeklyStats = calculateWeeklyStats(runs);
  const monthlyStats = calculateMonthlyStats(runs);

  const bestWeek = weeklyStats.reduce(
    (max, week) => (week.distance > max.distance ? week : max),
    weeklyStats[0] || { distance: 0, runs: 0, startDate: "" },
  );
  const bestMonth = monthlyStats.reduce(
    (max, month) => (month.distance > max.distance ? month : max),
    monthlyStats[0] || { distance: 0, runs: 0, month: "" },
  );

  return {
    longestDistance: {
      value: longestRun.distance,
      date: longestRun.date,
      runId: longestRun.id,
    },
    fastestPace: {
      value: fastestRun?.pace ? parsePaceToMinutes(fastestRun.pace) : 0,
      date: fastestRun?.date || "",
      runId: fastestRun?.id || "",
      distance: fastestRun?.distance || 0,
    },
    longestDuration: {
      value: longestDurationRun.duration || 0,
      date: longestDurationRun.date,
      runId: longestDurationRun.id,
    },
    mostElevation: {
      value: mostElevationRun.elevation || 0,
      date: mostElevationRun.date,
      runId: mostElevationRun.id,
    },
    bestWeek,
    bestMonth,
  };
}

export function calculateGoalProgress(
  runs: Run[],
  goals: { weekly?: number; monthly?: number; yearly?: number },
): GoalProgress[] {
  const now = new Date();
  const progress: GoalProgress[] = [];

  // Weekly goal
  if (goals.weekly) {
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const weekRuns = runs.filter((run) => {
      const runDate = parseISO(run.date);
      return isWithinInterval(runDate, { start: weekStart, end: weekEnd });
    });
    const weekDistance = weekRuns.reduce((sum, run) => sum + run.distance, 0);

    progress.push({
      type: "distance",
      target: goals.weekly,
      current: weekDistance,
      percentage: (weekDistance / goals.weekly) * 100,
      timeframe: "week",
      onTrack: weekDistance >= goals.weekly,
      projectedCompletion: weekDistance,
    });
  }

  // Monthly goal
  if (goals.monthly) {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthRuns = runs.filter((run) => {
      const runDate = parseISO(run.date);
      return isWithinInterval(runDate, { start: monthStart, end: monthEnd });
    });
    const monthDistance = monthRuns.reduce((sum, run) => sum + run.distance, 0);

    progress.push({
      type: "distance",
      target: goals.monthly,
      current: monthDistance,
      percentage: (monthDistance / goals.monthly) * 100,
      timeframe: "month",
      onTrack: monthDistance >= goals.monthly,
      projectedCompletion: monthDistance,
    });
  }

  // Yearly goal
  if (goals.yearly) {
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const yearRuns = runs.filter((run) => {
      const runDate = parseISO(run.date);
      return isWithinInterval(runDate, { start: yearStart, end: yearEnd });
    });
    const yearDistance = yearRuns.reduce((sum, run) => sum + run.distance, 0);

    progress.push({
      type: "distance",
      target: goals.yearly,
      current: yearDistance,
      percentage: (yearDistance / goals.yearly) * 100,
      timeframe: "year",
      onTrack: yearDistance >= goals.yearly,
      projectedCompletion: yearDistance,
    });
  }

  return progress;
}

// Helper functions
function parsePaceToMinutes(pace: string): number {
  const parts = pace.split(":");
  if (parts.length !== 2) return 0;
  return parseInt(parts[0]) + parseInt(parts[1]) / 60;
}

function formatMinutesToPace(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const value = String(item[key] || "Unknown");
      (groups[value] = groups[value] || []).push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}

function getAverageWeeklyMileage(runs: Run[]): number {
  if (runs.length === 0) return 0;

  const sortedRuns = runs.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const firstRunDate = parseISO(sortedRuns[0].date);
  const lastRunDate = parseISO(sortedRuns[sortedRuns.length - 1].date);

  const weeks = Math.ceil(
    (lastRunDate.getTime() - firstRunDate.getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );
  const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);

  return weeks > 0 ? totalDistance / weeks : 0;
}

function calculateWeeklyStats(
  runs: Run[],
): Array<{ distance: number; runs: number; startDate: string }> {
  const weekGroups = new Map<string, Run[]>();

  runs.forEach((run) => {
    const runDate = parseISO(run.date);
    const weekStart = startOfWeek(runDate);
    const weekKey = format(weekStart, "yyyy-MM-dd");

    if (!weekGroups.has(weekKey)) {
      weekGroups.set(weekKey, []);
    }
    weekGroups.get(weekKey)!.push(run);
  });

  return Array.from(weekGroups.entries()).map(([weekStart, weekRuns]) => ({
    distance: weekRuns.reduce((sum, run) => sum + run.distance, 0),
    runs: weekRuns.length,
    startDate: weekStart,
  }));
}

function calculateMonthlyStats(
  runs: Run[],
): Array<{ distance: number; runs: number; month: string }> {
  const monthGroups = new Map<string, Run[]>();

  runs.forEach((run) => {
    const runDate = parseISO(run.date);
    const monthKey = format(runDate, "yyyy-MM");

    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, []);
    }
    monthGroups.get(monthKey)!.push(run);
  });

  return Array.from(monthGroups.entries()).map(([month, monthRuns]) => ({
    distance: monthRuns.reduce((sum, run) => sum + run.distance, 0),
    runs: monthRuns.length,
    month,
  }));
}

// Export utility functions for pace formatting
export { formatMinutesToPace, parsePaceToMinutes };
