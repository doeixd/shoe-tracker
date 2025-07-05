import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  useAnalyzeUserBehaviorAction,
  useGetIntelligentPrefetchAction,
} from "~/queries";

// Types for user behavior tracking
interface RouteVisit {
  route: string;
  timestamp: number;
  duration: number;
  referrer?: string;
}

interface UserInteraction {
  type: "click" | "hover" | "scroll" | "focus" | "touch";
  target: string;
  timestamp: number;
  elementType?: string;
  elementText?: string;
}

interface SessionData {
  sessionId: string;
  startTime: number;
  currentRoute: string;
  routeHistory: RouteVisit[];
  interactions: UserInteraction[];
  deviceInfo: {
    type: string;
    connection: string;
    viewport: string;
    userAgent: string;
  };
}

interface BehaviorPatterns {
  mostVisitedRoutes: string[];
  commonSequences: string[];
  averageSessionDuration: number;
  preferredInteractionType: string;
  timeOfDayPreferences: Record<string, number>;
  routePreferences: Record<string, number>;
}

/**
 * Phase 2: User Behavior Tracking Hook
 *
 * Tracks user behavior patterns to enable smart preloading decisions:
 * - Route navigation patterns
 * - Interaction preferences
 * - Time-based behavior
 * - Device-specific patterns
 * - Connection-aware tracking
 */
export function useUserBehaviorTracking() {
  const router = useRouter();
  const analyzeUserBehavior = useAnalyzeUserBehaviorAction();
  const getIntelligentPrefetch = useGetIntelligentPrefetchAction();

  // Session state
  const [sessionData, setSessionData] = useState<SessionData>(() => {
    const sessionId = crypto.randomUUID();
    const connection = (navigator as any)?.connection;

    return {
      sessionId,
      startTime: Date.now(),
      currentRoute: router.state.location.pathname,
      routeHistory: [],
      interactions: [],
      deviceInfo: {
        type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "mobile" : "desktop",
        connection: connection?.effectiveType || "4g",
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent,
      },
    };
  });

  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPatterns | null>(null);
  const [isTracking, setIsTracking] = useState(true);

  // Refs for tracking
  const routeStartTime = useRef(Date.now());
  const interactionBuffer = useRef<UserInteraction[]>([]);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);

  // Track route changes
  useEffect(() => {
    const currentPath = router.state.location.pathname;
    const now = Date.now();

    // Record previous route duration if we had one
    if (sessionData.currentRoute !== currentPath && sessionData.routeHistory.length > 0) {
      const duration = now - routeStartTime.current;

      setSessionData(prev => ({
        ...prev,
        routeHistory: [
          ...prev.routeHistory,
          {
            route: prev.currentRoute,
            timestamp: routeStartTime.current,
            duration,
            referrer: document.referrer || undefined,
          },
        ],
        currentRoute: currentPath,
      }));
    }

    routeStartTime.current = now;
  }, [router.state.location.pathname]);

  // Track user interactions
  const trackInteraction = useCallback((
    type: UserInteraction["type"],
    target: string,
    elementInfo?: { type?: string; text?: string }
  ) => {
    if (!isTracking) return;

    const interaction: UserInteraction = {
      type,
      target,
      timestamp: Date.now(),
      elementType: elementInfo?.type,
      elementText: elementInfo?.text,
    };

    interactionBuffer.current.push(interaction);

    // Batch interactions to avoid too frequent updates
    if (interactionBuffer.current.length >= 10) {
      flushInteractions();
    }
  }, [isTracking]);

  // Flush interaction buffer to state
  const flushInteractions = useCallback(() => {
    if (interactionBuffer.current.length === 0) return;

    setSessionData(prev => ({
      ...prev,
      interactions: [...prev.interactions, ...interactionBuffer.current],
    }));

    interactionBuffer.current = [];
  }, []);

  // Set up global interaction listeners
  useEffect(() => {
    if (!isTracking) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const targetInfo = {
        type: target.tagName.toLowerCase(),
        text: target.textContent?.slice(0, 50) || undefined,
      };

      trackInteraction("click", getElementSelector(target), targetInfo);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" || target.getAttribute("role") === "button") {
        trackInteraction("hover", getElementSelector(target));
      }
    };

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > 0 && scrollPercent % 25 === 0) {
        trackInteraction("scroll", `${scrollPercent}%`);
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        trackInteraction("focus", getElementSelector(target));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      trackInteraction("touch", getElementSelector(target));
    };

    // Add event listeners
    document.addEventListener("click", handleClick, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true, capture: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("focusin", handleFocus, { passive: true });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("mouseenter", handleMouseEnter, true);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isTracking, trackInteraction]);

  // Periodic behavior analysis
  useEffect(() => {
    if (!isTracking) return;

    const analyzeAndUpdate = async () => {
      try {
        // Flush any pending interactions
        flushInteractions();

        // Only analyze if we have enough data
        if (sessionData.routeHistory.length < 2) return;

        const analysis = await analyzeUserBehavior.execute({
          userId: "current-user", // TODO: Get actual user ID
          sessionData: {
            startTime: sessionData.startTime,
            currentRoute: sessionData.currentRoute,
            routeHistory: sessionData.routeHistory,
            interactions: sessionData.interactions,
          },
        });

        // Update behavior patterns based on analysis
        setBehaviorPatterns({
          mostVisitedRoutes: analysis.patterns.mostVisited || [],
          commonSequences: analysis.patterns.commonSequences || [],
          averageSessionDuration: analysis.patterns.averageRouteTime || 0,
          preferredInteractionType: getMostCommonInteractionType(sessionData.interactions),
          timeOfDayPreferences: getTimeOfDayPreferences(sessionData.routeHistory),
          routePreferences: getRoutePreferences(sessionData.routeHistory),
        });

      } catch (error) {
        console.debug("Behavior analysis failed:", error);
      }
    };

    // Analyze every 30 seconds
    analysisInterval.current = setInterval(analyzeAndUpdate, 30000);

    return () => {
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, [isTracking, sessionData, analyzeUserBehavior, flushInteractions]);

  // Get intelligent prefetch suggestions
  const getPrefetchSuggestions = useCallback(async () => {
    try {
      const suggestions = await getIntelligentPrefetch.execute({
        userId: "current-user", // TODO: Get actual user ID
        context: {
          currentRoute: sessionData.currentRoute,
          userAgent: sessionData.deviceInfo.userAgent,
          connectionType: sessionData.deviceInfo.connection,
          viewportSize: sessionData.deviceInfo.viewport,
          timeOfDay: new Date().getHours(),
        },
      });

      return suggestions;
    } catch (error) {
      console.debug("Failed to get prefetch suggestions:", error);
      return null;
    }
  }, [sessionData, getIntelligentPrefetch]);

  // Get route-specific recommendations
  const getRouteRecommendations = useCallback((route: string) => {
    if (!behaviorPatterns) return [];

    const recommendations: string[] = [];

    // Based on common sequences
    const relevantSequences = behaviorPatterns.commonSequences
      .filter(seq => seq.startsWith(route))
      .map(seq => seq.split("->")[1]);

    recommendations.push(...relevantSequences);

    // Based on route preferences
    const preferredRoutes = Object.entries(behaviorPatterns.routePreferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([route]) => route);

    recommendations.push(...preferredRoutes);

    // Remove duplicates and current route
    return [...new Set(recommendations)].filter(r => r !== route).slice(0, 5);
  }, [behaviorPatterns]);

  // Control tracking
  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    flushInteractions();
  }, [flushInteractions]);

  const resetSession = useCallback(() => {
    setSessionData(prev => ({
      ...prev,
      startTime: Date.now(),
      routeHistory: [],
      interactions: [],
    }));
    setBehaviorPatterns(null);
  }, []);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    return {
      duration: Date.now() - sessionData.startTime,
      routesVisited: sessionData.routeHistory.length,
      totalInteractions: sessionData.interactions.length,
      averageRouteTime: sessionData.routeHistory.length > 0
        ? sessionData.routeHistory.reduce((sum, route) => sum + route.duration, 0) / sessionData.routeHistory.length
        : 0,
      deviceInfo: sessionData.deviceInfo,
    };
  }, [sessionData]);

  return {
    // State
    sessionData,
    behaviorPatterns,
    isTracking,

    // Actions
    trackInteraction,
    startTracking,
    stopTracking,
    resetSession,

    // Analysis
    getPrefetchSuggestions,
    getRouteRecommendations,
    getSessionSummary,
  };
}

/**
 * Hook for route-specific behavior tracking
 */
export function useRouteBehaviorTracking(route: string) {
  const { trackInteraction, getRouteRecommendations, behaviorPatterns } = useUserBehaviorTracking();
  const router = useRouter();

  const recommendations = getRouteRecommendations(route);

  // Track route-specific interactions
  const trackRouteInteraction = useCallback((
    type: UserInteraction["type"],
    target: string,
    elementInfo?: { type?: string; text?: string }
  ) => {
    trackInteraction(type, `${route}:${target}`, elementInfo);
  }, [route, trackInteraction]);

  // Get route performance metrics
  const getRouteMetrics = useCallback(() => {
    if (!behaviorPatterns) return null;

    const routeVisits = behaviorPatterns.routePreferences[route] || 0;
    const isFrequent = routeVisits > 3;
    const recommendedStrategy = isFrequent ? "render" : "intent";

    return {
      visitCount: routeVisits,
      isFrequentDestination: isFrequent,
      recommendedPreloadStrategy: recommendedStrategy,
      recommendations,
    };
  }, [route, behaviorPatterns, recommendations]);

  return {
    trackRouteInteraction,
    getRouteMetrics,
    recommendations,
  };
}

// Helper functions
function getElementSelector(element: HTMLElement): string {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${element.className.split(" ")[0]}`;
  return element.tagName.toLowerCase();
}

function getMostCommonInteractionType(interactions: UserInteraction[]): string {
  const counts = interactions.reduce((acc, interaction) => {
    acc[interaction.type] = (acc[interaction.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || "click";
}

function getTimeOfDayPreferences(routeHistory: RouteVisit[]): Record<string, number> {
  const preferences: Record<string, number> = {};

  routeHistory.forEach(visit => {
    const hour = new Date(visit.timestamp).getHours();
    const timeSlot = getTimeSlot(hour);
    preferences[timeSlot] = (preferences[timeSlot] || 0) + 1;
  });

  return preferences;
}

function getTimeSlot(hour: number): string {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function getRoutePreferences(routeHistory: RouteVisit[]): Record<string, number> {
  const preferences: Record<string, number> = {};

  routeHistory.forEach(visit => {
    preferences[visit.route] = (preferences[visit.route] || 0) + 1;
  });

  return preferences;
}

export default useUserBehaviorTracking;
