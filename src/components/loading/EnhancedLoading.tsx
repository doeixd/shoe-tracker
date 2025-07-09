import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import {
  DashboardSkeleton,
  ShoesListingSkeleton,
  ListingSkeleton,
  DetailPageSkeleton,
  NavigationSkeleton,
} from "./PageSkeletons";

// Enhanced loading phases
type LoadingPhase = "instant" | "skeleton" | "spinner" | "error" | "complete";

interface EnhancedLoadingProps {
  message?: string;
  holdDelay?: number;
  skeletonDelay?: number;
  spinnerDelay?: number;
  minShowTime?: number;
  showProgress?: boolean;
  layout?: "dashboard" | "shoes" | "list" | "detail" | "navigation";
  error?: Error | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function EnhancedLoading({
  message = "Loading...",
  holdDelay = 50, // Further reduced for faster loading
  skeletonDelay = 100,
  spinnerDelay = 800,
  minShowTime = 100,
  showProgress = false,
  layout = "list",
  error = null,
  onRetry,
  children,
}: EnhancedLoadingProps) {
  const [phase, setPhase] = useState<LoadingPhase>("instant");
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const phaseTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      phaseTimerRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Handle error state
  useEffect(() => {
    if (error) {
      setPhase("error");
      return;
    }

    // Progress through loading phases
    const timers: NodeJS.Timeout[] = [];

    // Phase 1: Hold (show nothing or cached content)
    const holdTimer = setTimeout(() => {
      setPhase("skeleton");
    }, holdDelay);
    timers.push(holdTimer);

    // Phase 2: Show skeleton
    const skeletonTimer = setTimeout(() => {
      setPhase("spinner");
    }, holdDelay + skeletonDelay);
    timers.push(skeletonTimer);

    // Phase 3: Show spinner if still loading
    const spinnerTimer = setTimeout(
      () => {
        if (phase !== "complete") {
          setPhase("spinner");
        }
      },
      holdDelay + skeletonDelay + spinnerDelay,
    );
    timers.push(spinnerTimer);

    phaseTimerRef.current = timers;

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [error, holdDelay, skeletonDelay, spinnerDelay, phase]);

  // Simulate progress for better perceived performance
  useEffect(() => {
    if (!showProgress || phase === "complete" || phase === "error") return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Asymptotic approach to 100%
        const remaining = 100 - prev;
        const increment = remaining * 0.1 + Math.random() * 2;
        return Math.min(prev + increment, 95);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [showProgress, phase]);

  // Complete loading when children are provided
  useEffect(() => {
    if (children && phase !== "error") {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed >= minShowTime) {
        setPhase("complete");
        setProgress(100);
      } else {
        const remainingTime = minShowTime - elapsed;
        const completeTimer = setTimeout(() => {
          setPhase("complete");
          setProgress(100);
        }, remainingTime);

        return () => clearTimeout(completeTimer);
      }
    }
  }, [children, phase, minShowTime]);

  // Render appropriate skeleton based on layout
  const renderSkeleton = () => {
    const skeletonProps = { animate: true };

    switch (layout) {
      case "dashboard":
        return <DashboardSkeleton {...skeletonProps} />;
      case "shoes":
        return <ShoesListingSkeleton {...skeletonProps} />;
      case "detail":
        return <DetailPageSkeleton {...skeletonProps} />;
      case "navigation":
        return <NavigationSkeleton {...skeletonProps} />;
      case "list":
      default:
        return <ListingSkeleton {...skeletonProps} />;
    }
  };

  // Error state
  if (phase === "error" || error) {
    return (
      <ErrorDisplay
        error={error}
        message={message}
        onRetry={onRetry}
        layout={layout}
      />
    );
  }

  // Complete - show children
  if (phase === "complete" && children) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Instant phase - show nothing (let cached content show)
  if (phase === "instant") {
    return showProgress ? <ProgressBar progress={progress} /> : null;
  }

  // Skeleton phase
  if (phase === "skeleton") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {showProgress && <ProgressBar progress={progress} />}
          {renderSkeleton()}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Spinner phase
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {showProgress && <ProgressBar progress={progress} />}
        <SpinnerDisplay message={message} layout={layout} />
      </motion.div>
    </AnimatePresence>
  );
}

// Progress bar component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// Spinner display component
function SpinnerDisplay({
  message,
  layout,
}: {
  message: string;
  layout: string;
}) {
  const isMinimal = layout === "navigation";

  if (isMinimal) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center p-8"
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <motion.div
            className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {message}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is taking longer than usual...
        </p>
      </motion.div>
    </div>
  );
}

// Error display component
function ErrorDisplay({
  error,
  message,
  onRetry,
  layout,
}: {
  error: Error | null;
  message: string;
  onRetry?: () => void;
  layout: string;
}) {
  const isNetworkError =
    error?.message?.includes("network") ||
    error?.message?.includes("fetch") ||
    error?.message?.includes("offline");

  const isAuthError =
    error?.message?.includes("not authenticated") ||
    error?.message?.includes("Unauthorized") ||
    error?.message?.includes("access denied");

  const getErrorInfo = () => {
    if (isAuthError) {
      return {
        title: "Authentication Required",
        description: "Please sign in to access this content.",
        icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
        color: "amber",
      };
    }

    if (isNetworkError) {
      return {
        title: "Connection Problem",
        description: "Unable to load content. Check your internet connection.",
        icon: <WifiOff className="w-8 h-8 text-red-500" />,
        color: "red",
      };
    }

    return {
      title: "Something went wrong",
      description: error?.message || "An unexpected error occurred.",
      icon: <AlertCircle className="w-8 h-8 text-red-500" />,
      color: "red",
    };
  };

  const errorInfo = getErrorInfo();
  const isMinimal = layout === "navigation";

  if (isMinimal) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load</span>
          {onRetry && !isAuthError && (
            <button
              onClick={onRetry}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md"
      >
        <div
          className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-${errorInfo.color}-50 border border-${errorInfo.color}-200`}
        >
          {errorInfo.icon}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {errorInfo.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {errorInfo.description}
        </p>

        {onRetry && !isAuthError && (
          <motion.button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </motion.button>
        )}

        {isAuthError && (
          <motion.button
            onClick={() => (window.location.href = "/auth/signin")}
            className="inline-flex items-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

// Progressive loading hook for better UX
export function useProgressiveLoading<T>(
  data: T | undefined,
  isLoading: boolean,
  error: Error | null = null,
) {
  const [phase, setPhase] = useState<LoadingPhase>("instant");
  const [cachedData, setCachedData] = useState<T | undefined>(data);

  useEffect(() => {
    if (error) {
      setPhase("error");
      return;
    }

    if (!isLoading && data) {
      setPhase("complete");
      setCachedData(data);
      return;
    }

    if (isLoading) {
      if (cachedData) {
        // We have cached data, show it immediately
        setPhase("complete");
      } else {
        // No cached data, go through loading phases
        setPhase("instant");

        const timer = setTimeout(() => {
          setPhase("skeleton");
        }, 200);

        return () => clearTimeout(timer);
      }
    }
  }, [data, isLoading, error, cachedData]);

  return {
    phase,
    displayData: cachedData || data,
    isStale: isLoading && !!cachedData,
  };
}

// Optimized loading wrapper for route components
export function RouteLoadingWrapper({
  children,
  isLoading,
  error,
  layout = "list",
  message = "Loading...",
  onRetry,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  error?: Error | null;
  layout?: "dashboard" | "shoes" | "list" | "detail" | "navigation";
  message?: string;
  onRetry?: () => void;
}) {
  if (!isLoading && !error) {
    return <>{children}</>;
  }

  return (
    <EnhancedLoading
      message={message}
      layout={layout}
      error={error}
      onRetry={onRetry}
      holdDelay={50}
      skeletonDelay={100}
      spinnerDelay={600}
      showProgress={false}
    >
      {!isLoading ? children : null}
    </EnhancedLoading>
  );
}
