import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "@tanstack/react-router";

const VISITED_ROUTES_KEY = "visited_routes";

interface FirstVisitOptions {
  /** Route path to track. If not provided, uses current route */
  route?: string;
  /** Reset visit status for this route */
  reset?: boolean;
  /** Disable localStorage persistence (useful for testing) */
  disablePersistence?: boolean;
}

/**
 * Hook to track first-time visits to routes for conditional animations
 *
 * @param options Configuration options
 * @returns Object with isFirstVisit boolean and markAsVisited function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isFirstVisit } = useFirstVisit();
 *
 *   return (
 *     <motion.div
 *       initial={isFirstVisit ? { opacity: 0, y: 20 } : false}
 *       animate={isFirstVisit ? { opacity: 1, y: 0 } : false}
 *       transition={isFirstVisit ? { duration: 0.5 } : { duration: 0 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useFirstVisit(options: FirstVisitOptions = {}) {
  const location = useLocation();
  const { route, reset = false, disablePersistence = false } = options;

  // Use provided route or current pathname
  const targetRoute = route || location.pathname;

  const [visitedRoutes, setVisitedRoutes] = useState<Set<string>>(() => {
    if (disablePersistence || typeof window === "undefined") {
      return new Set();
    }

    try {
      const stored = localStorage.getItem(VISITED_ROUTES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.warn("Failed to load visited routes from localStorage:", error);
      return new Set();
    }
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure we're hydrated on client side
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isFirstVisit = isHydrated ? !visitedRoutes.has(targetRoute) : false;

  const markAsVisited = useCallback(() => {
    setVisitedRoutes((prev) => {
      const newSet = new Set(prev);
      newSet.add(targetRoute);

      if (!disablePersistence && typeof window !== "undefined") {
        try {
          localStorage.setItem(VISITED_ROUTES_KEY, JSON.stringify([...newSet]));
        } catch (error) {
          console.warn("Failed to save visited routes to localStorage:", error);
        }
      }

      return newSet;
    });
  }, [targetRoute, disablePersistence]);

  const resetVisit = useCallback(() => {
    setVisitedRoutes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(targetRoute);

      if (!disablePersistence && typeof window !== "undefined") {
        try {
          localStorage.setItem(VISITED_ROUTES_KEY, JSON.stringify([...newSet]));
        } catch (error) {
          console.warn("Failed to save visited routes to localStorage:", error);
        }
      }

      return newSet;
    });
  }, [targetRoute, disablePersistence]);

  const clearAllVisits = useCallback(() => {
    setVisitedRoutes(new Set());

    if (!disablePersistence && typeof window !== "undefined") {
      try {
        localStorage.removeItem(VISITED_ROUTES_KEY);
      } catch (error) {
        console.warn(
          "Failed to clear visited routes from localStorage:",
          error,
        );
      }
    }
  }, [disablePersistence]);

  // Auto-mark as visited when component mounts (after animations have had time to run)
  useEffect(() => {
    if (isHydrated && isFirstVisit) {
      // Delay marking as visited to allow animations to complete
      const timer = setTimeout(() => {
        markAsVisited();
      }, 1000); // 1 second delay to ensure animations finish

      return () => clearTimeout(timer);
    }
  }, [targetRoute, isFirstVisit, isHydrated, markAsVisited]);

  // Handle reset option
  useEffect(() => {
    if (reset) {
      resetVisit();
    }
  }, [reset, resetVisit]);

  return {
    isFirstVisit,
    markAsVisited,
    resetVisit,
    clearAllVisits,
    visitedRoutes: [...visitedRoutes],
  };
}

/**
 * Utility function to get animation props based on first visit status
 *
 * @param isFirstVisit Whether this is the first visit
 * @param animationProps Animation configuration
 * @returns Motion props or false to disable animations
 *
 * @example
 * ```tsx
 * const { isFirstVisit } = useFirstVisit();
 *
 * <motion.div
 *   {...getAnimationProps(isFirstVisit, {
 *     initial: { opacity: 0, y: 20 },
 *     animate: { opacity: 1, y: 0 },
 *     transition: { duration: 0.5 }
 *   })}
 * >
 *   Content
 * </motion.div>
 * ```
 */
export function getAnimationProps(
  isFirstVisit: boolean,
  animationProps: {
    initial?: any;
    animate?: any;
    transition?: any;
    exit?: any;
  },
): any {
  if (!isFirstVisit) {
    return {
      initial: false,
      animate: false,
      transition: { duration: 0 },
      exit: false,
    };
  }

  return animationProps;
}

/**
 * Higher-order component wrapper for conditional animations
 *
 * @example
 * ```tsx
 * const AnimatedCard = withFirstVisitAnimation(motion.div, {
 *   initial: { opacity: 0, scale: 0.95 },
 *   animate: { opacity: 1, scale: 1 },
 *   transition: { duration: 0.3 }
 * });
 *
 * function MyComponent() {
 *   return <AnimatedCard>Content</AnimatedCard>;
 * }
 * ```
 */
export function withFirstVisitAnimation<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  defaultAnimationProps: {
    initial?: any;
    animate?: any;
    transition?: any;
    exit?: any;
  },
  options?: FirstVisitOptions,
): React.ComponentType<T> {
  return function WrappedComponent(props: T) {
    const { isFirstVisit } = useFirstVisit(options);
    const animationProps = getAnimationProps(
      isFirstVisit,
      defaultAnimationProps,
    );

    return React.createElement(Component, { ...props, ...animationProps });
  };
}
