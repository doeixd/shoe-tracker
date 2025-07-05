import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useUserBehaviorTracking } from "./useUserBehaviorTracking";
import { usePrefetching } from "../utils/prefetch";

// Types for monitoring Phase 2 smart preloading
interface PreloadMetrics {
  totalPreloads: number;
  successfulPreloads: number;
  failedPreloads: number;
  averagePreloadTime: number;
  cacheHitRate: number;
  networkSavings: number;
}

interface RoutePerformance {
  route: string;
  preloadTime: number;
  navigationTime: number;
  wasPreloaded: boolean;
  strategy: "intent" | "viewport" | "render" | "none";
  priority: "high" | "medium" | "low";
  timestamp: number;
}

interface SmartPreloadingStats {
  session: {
    startTime: number;
    totalNavigations: number;
    instantNavigations: number;
    preloadSuccessRate: number;
  };
  routes: Record<string, RoutePerformance[]>;
  strategies: Record<string, { uses: number; successRate: number }>;
  userBehavior: {
    mostFrequentRoutes: string[];
    predictedAccuracy: number;
    adaptiveStrategies: Record<string, string>;
  };
  performance: PreloadMetrics;
}

/**
 * Phase 2: Smart Preloading Performance Monitor
 *
 * Monitors and analyzes the effectiveness of smart preloading strategies:
 * - Tracks preload success rates by strategy
 * - Measures navigation performance improvements
 * - Monitors cache hit rates and network savings
 * - Provides adaptive recommendations
 * - Integrates with user behavior tracking
 */
export function useSmartPreloadingMonitor() {
  const router = useRouter();
  const { sessionData, behaviorPatterns } = useUserBehaviorTracking();
  const { canPrefetch } = usePrefetching();

  const [stats, setStats] = useState<SmartPreloadingStats>(() => ({
    session: {
      startTime: Date.now(),
      totalNavigations: 0,
      instantNavigations: 0,
      preloadSuccessRate: 0,
    },
    routes: {},
    strategies: {
      intent: { uses: 0, successRate: 0 },
      viewport: { uses: 0, successRate: 0 },
      render: { uses: 0, successRate: 0 },
      none: { uses: 0, successRate: 0 },
    },
    userBehavior: {
      mostFrequentRoutes: [],
      predictedAccuracy: 0,
      adaptiveStrategies: {},
    },
    performance: {
      totalPreloads: 0,
      successfulPreloads: 0,
      failedPreloads: 0,
      averagePreloadTime: 0,
      cacheHitRate: 0,
      networkSavings: 0,
    },
  }));

  const [isMonitoring, setIsMonitoring] = useState(true);
  const preloadTimes = useRef<Map<string, number>>(new Map());
  const navigationTimes = useRef<Map<string, number>>(new Map());
  const preloadedRoutes = useRef<Set<string>>(new Set());

  // Track preload start
  const trackPreloadStart = useCallback((route: string, strategy: string, priority: string) => {
    if (!isMonitoring) return;

    const startTime = performance.now();
    preloadTimes.current.set(`${route}:${strategy}`, startTime);

    setStats(prev => ({
      ...prev,
      strategies: {
        ...prev.strategies,
        [strategy]: {
          ...prev.strategies[strategy as keyof typeof prev.strategies],
          uses: prev.strategies[strategy as keyof typeof prev.strategies].uses + 1,
        },
      },
      performance: {
        ...prev.performance,
        totalPreloads: prev.performance.totalPreloads + 1,
      },
    }));
  }, [isMonitoring]);

  // Track preload completion
  const trackPreloadComplete = useCallback((
    route: string,
    strategy: string,
    success: boolean
  ) => {
    if (!isMonitoring) return;

    const key = `${route}:${strategy}`;
    const startTime = preloadTimes.current.get(key);

    if (startTime) {
      const duration = performance.now() - startTime;
      preloadTimes.current.delete(key);

      if (success) {
        preloadedRoutes.current.add(route);
      }

      setStats(prev => {
        const strategyStats = prev.strategies[strategy as keyof typeof prev.strategies];
        const newSuccessCount = success ?
          (strategyStats.uses * strategyStats.successRate + 1) :
          (strategyStats.uses * strategyStats.successRate);

        return {
          ...prev,
          strategies: {
            ...prev.strategies,
            [strategy]: {
              uses: strategyStats.uses,
              successRate: newSuccessCount / strategyStats.uses,
            },
          },
          performance: {
            ...prev.performance,
            successfulPreloads: success ?
              prev.performance.successfulPreloads + 1 :
              prev.performance.successfulPreloads,
            failedPreloads: !success ?
              prev.performance.failedPreloads + 1 :
              prev.performance.failedPreloads,
            averagePreloadTime: success ?
              ((prev.performance.averagePreloadTime * prev.performance.successfulPreloads) + duration) /
              (prev.performance.successfulPreloads + 1) :
              prev.performance.averagePreloadTime,
          },
        };
      });
    }
  }, [isMonitoring]);

  // Track navigation start
  const trackNavigationStart = useCallback((route: string) => {
    if (!isMonitoring) return;

    const startTime = performance.now();
    navigationTimes.current.set(route, startTime);
  }, [isMonitoring]);

  // Track navigation complete
  const trackNavigationComplete = useCallback((route: string) => {
    if (!isMonitoring) return;

    const startTime = navigationTimes.current.get(route);
    if (!startTime) return;

    const navigationTime = performance.now() - startTime;
    const wasPreloaded = preloadedRoutes.current.has(route);

    // Consider navigation "instant" if under 100ms
    const isInstant = navigationTime < 100;

    navigationTimes.current.delete(route);

    setStats(prev => {
      const routePerformance: RoutePerformance = {
        route,
        preloadTime: 0, // TODO: Track this separately
        navigationTime,
        wasPreloaded,
        strategy: "intent", // TODO: Track actual strategy used
        priority: "medium", // TODO: Track actual priority
        timestamp: Date.now(),
      };

      return {
        ...prev,
        session: {
          ...prev.session,
          totalNavigations: prev.session.totalNavigations + 1,
          instantNavigations: isInstant ?
            prev.session.instantNavigations + 1 :
            prev.session.instantNavigations,
          preloadSuccessRate: wasPreloaded ?
            ((prev.session.preloadSuccessRate * prev.session.totalNavigations) + 1) /
            (prev.session.totalNavigations + 1) :
            (prev.session.preloadSuccessRate * prev.session.totalNavigations) /
            (prev.session.totalNavigations + 1),
        },
        routes: {
          ...prev.routes,
          [route]: [...(prev.routes[route] || []), routePerformance].slice(-10), // Keep last 10
        },
        performance: {
          ...prev.performance,
          cacheHitRate: wasPreloaded ?
            ((prev.performance.cacheHitRate * prev.session.totalNavigations) + 1) /
            (prev.session.totalNavigations + 1) :
            (prev.performance.cacheHitRate * prev.session.totalNavigations) /
            (prev.session.totalNavigations + 1),
        },
      };
    });

    // Remove from preloaded set after use
    preloadedRoutes.current.delete(route);
  }, [isMonitoring]);

  // Monitor router state changes
  useEffect(() => {
    const currentPath = router.state.location.pathname;

    trackNavigationStart(currentPath);

    // Simulate navigation complete after router settles
    const timer = setTimeout(() => {
      trackNavigationComplete(currentPath);
    }, 100);

    return () => clearTimeout(timer);
  }, [router.state.location.pathname, trackNavigationStart, trackNavigationComplete]);

  // Update user behavior insights
  useEffect(() => {
    if (behaviorPatterns) {
      setStats(prev => ({
        ...prev,
        userBehavior: {
          mostFrequentRoutes: behaviorPatterns.mostVisitedRoutes.slice(0, 5),
          predictedAccuracy: calculatePredictionAccuracy(prev.routes, behaviorPatterns),
          adaptiveStrategies: generateAdaptiveStrategies(prev.strategies, behaviorPatterns),
        },
      }));
    }
  }, [behaviorPatterns]);

  // Calculate network savings estimate
  const calculateNetworkSavings = useCallback(() => {
    const averageRouteSize = 50; // KB estimate
    const preloadHits = stats.performance.totalPreloads * stats.performance.cacheHitRate;
    return preloadHits * averageRouteSize;
  }, [stats.performance]);

  // Get performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (stats.session.preloadSuccessRate < 0.7) {
      recommendations.push("Consider more aggressive preloading strategies");
    }

    // Strategy-specific recommendations
    Object.entries(stats.strategies).forEach(([strategy, data]) => {
      if (data.uses > 5 && data.successRate < 0.5) {
        recommendations.push(`${strategy} strategy showing low success rate - consider tuning`);
      }
    });

    // Instant navigation recommendations
    const instantRate = stats.session.instantNavigations / Math.max(stats.session.totalNavigations, 1);
    if (instantRate < 0.7) {
      recommendations.push("Target: 70%+ instant navigations - increase critical route preloading");
    }

    return recommendations;
  }, [stats]);

  // Get route-specific insights
  const getRouteInsights = useCallback((route: string) => {
    const routeData = stats.routes[route] || [];

    if (routeData.length === 0) {
      return {
        averageNavigationTime: 0,
        preloadSuccessRate: 0,
        recommendedStrategy: "intent" as const,
        isFrequent: false,
      };
    }

    const averageNavigationTime = routeData.reduce((sum, perf) => sum + perf.navigationTime, 0) / routeData.length;
    const preloadSuccessRate = routeData.filter(perf => perf.wasPreloaded).length / routeData.length;
    const isFrequent = behaviorPatterns?.mostVisitedRoutes.includes(route) || false;

    // Recommend strategy based on performance
    let recommendedStrategy: "intent" | "viewport" | "render" = "intent";
    if (isFrequent && preloadSuccessRate > 0.8) {
      recommendedStrategy = "render";
    } else if (averageNavigationTime > 200) {
      recommendedStrategy = "intent";
    }

    return {
      averageNavigationTime,
      preloadSuccessRate,
      recommendedStrategy,
      isFrequent,
    };
  }, [stats.routes, behaviorPatterns]);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - stats.session.startTime,
      ...stats,
      networkSavings: calculateNetworkSavings(),
      recommendations: getPerformanceRecommendations(),
    };
  }, [stats, calculateNetworkSavings, getPerformanceRecommendations]);

  // Reset statistics
  const resetStats = useCallback(() => {
    setStats({
      session: {
        startTime: Date.now(),
        totalNavigations: 0,
        instantNavigations: 0,
        preloadSuccessRate: 0,
      },
      routes: {},
      strategies: {
        intent: { uses: 0, successRate: 0 },
        viewport: { uses: 0, successRate: 0 },
        render: { uses: 0, successRate: 0 },
        none: { uses: 0, successRate: 0 },
      },
      userBehavior: {
        mostFrequentRoutes: [],
        predictedAccuracy: 0,
        adaptiveStrategies: {},
      },
      performance: {
        totalPreloads: 0,
        successfulPreloads: 0,
        failedPreloads: 0,
        averagePreloadTime: 0,
        cacheHitRate: 0,
        networkSavings: 0,
      },
    });

    preloadTimes.current.clear();
    navigationTimes.current.clear();
    preloadedRoutes.current.clear();
  }, []);

  return {
    // State
    stats,
    isMonitoring,

    // Tracking functions
    trackPreloadStart,
    trackPreloadComplete,
    trackNavigationStart,
    trackNavigationComplete,

    // Analysis functions
    calculateNetworkSavings,
    getPerformanceRecommendations,
    getRouteInsights,

    // Control functions
    startMonitoring: () => setIsMonitoring(true),
    stopMonitoring: () => setIsMonitoring(false),
    resetStats,
    exportPerformanceData,
  };
}

// Helper function to calculate prediction accuracy
function calculatePredictionAccuracy(
  routes: Record<string, RoutePerformance[]>,
  behaviorPatterns: any
): number {
  if (!behaviorPatterns?.commonSequences) return 0;

  let correct = 0;
  let total = 0;

  Object.values(routes).forEach(routePerfs => {
    routePerfs.forEach((perf, index) => {
      if (index > 0) {
        const prevRoute = routePerfs[index - 1].route;
        const currentRoute = perf.route;
        const sequence = `${prevRoute}->${currentRoute}`;

        total++;
        if (behaviorPatterns.commonSequences.includes(sequence)) {
          correct++;
        }
      }
    });
  });

  return total > 0 ? correct / total : 0;
}

// Helper function to generate adaptive strategies
function generateAdaptiveStrategies(
  strategies: Record<string, { uses: number; successRate: number }>,
  behaviorPatterns: any
): Record<string, string> {
  const adaptive: Record<string, string> = {};

  // For frequent routes, use render strategy if intent is successful
  if (behaviorPatterns?.mostVisitedRoutes) {
    behaviorPatterns.mostVisitedRoutes.forEach((route: string) => {
      if (strategies.intent.successRate > 0.8) {
        adaptive[route] = "render";
      } else {
        adaptive[route] = "intent";
      }
    });
  }

  return adaptive;
}

export default useSmartPreloadingMonitor;
