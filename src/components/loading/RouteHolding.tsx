import React, { useState, useEffect, useRef } from "react";
import { Loader } from "../Loader";
import { motion, AnimatePresence } from "motion/react";

interface RouteHoldingProps {
  message?: string;
  holdDelay?: number;
  minShowTime?: number;
  children?: React.ReactNode;
  showProgress?: boolean;
}

export function RouteHolding({
  message = "Loading...",
  holdDelay = 1000,
  minShowTime = 500,
  children,
  showProgress = true,
}: RouteHoldingProps) {
  const [phase, setPhase] = useState<"holding" | "loading" | "complete">(
    "holding",
  );
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start the hold timer with progress simulation
    const holdTimer = setTimeout(() => {
      setPhase("loading");
      startTimeRef.current = Date.now();
    }, holdDelay);

    // Simulate progress during hold
    if (showProgress) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev; // Don't reach 100% during hold
          return prev + Math.random() * 5 + 2; // Random increments
        });
      }, 50);
    }

    return () => {
      clearTimeout(holdTimer);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [holdDelay, showProgress]);

  useEffect(() => {
    if (phase === "loading") {
      // Complete progress quickly when loading starts
      if (showProgress) {
        const completeProgress = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(completeProgress);
              return 100;
            }
            return prev + 10;
          });
        }, 50);
      }
    }
  }, [phase, showProgress]);

  // During hold phase, show progress or nothing
  if (phase === "holding") {
    if (showProgress && progress > 0) {
      return (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
          >
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `conic-gradient(from 0deg, transparent 0%, #3b82f6 ${progress}%, transparent ${progress}%)`,
                  clipPath: "circle(50%)",
                }}
              ></motion.div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(progress)}% loaded
              </p>
            </div>
          </motion.div>
        </div>
      );
    }
    return null; // Show nothing during hold if no progress
  }

  // Loading phase - show spinner
  if (phase === "loading") {
    // Check if minimum show time has passed
    if (children && startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < minShowTime) {
        return (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[200px]"
            >
              <div className="flex flex-col items-center space-y-4">
                <Loader />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        );
      }
      return <>{children}</>;
    }

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-[200px]"
        >
          <div className="flex flex-col items-center space-y-4">
            <Loader />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return <>{children}</>;
}

// Enhanced loading component with route holding
export function PageLoadingWithHold({
  message = "Loading...",
  holdDelay = 1000,
  showProgress = true,
}: {
  message?: string;
  holdDelay?: number;
  showProgress?: boolean;
}) {
  return (
    <RouteHolding
      message={message}
      holdDelay={holdDelay}
      showProgress={showProgress}
    />
  );
}

// Skeleton loader for better UX during route holding
export function ContentSkeleton({
  layout = "cards",
}: {
  layout?: "cards" | "list" | "detail";
}) {
  const renderCardsSkeleton = () => (
    <div className="animate-pulse space-y-6 p-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderDetailSkeleton = () => (
    <div className="animate-pulse space-y-6 p-4">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );

  switch (layout) {
    case "list":
      return renderListSkeleton();
    case "detail":
      return renderDetailSkeleton();
    default:
      return renderCardsSkeleton();
  }
}

// Smart loading component that shows skeleton during hold, then spinner
export function SmartPageLoading({
  message = "Loading...",
  holdDelay = 1000,
  showSkeleton = true,
  skeletonLayout = "cards",
}: {
  message?: string;
  holdDelay?: number;
  showSkeleton?: boolean;
  skeletonLayout?: "cards" | "list" | "detail";
}) {
  const [phase, setPhase] = useState<"holding" | "skeleton" | "spinner">(
    "holding",
  );

  useEffect(() => {
    const holdTimer = setTimeout(() => {
      setPhase(showSkeleton ? "skeleton" : "spinner");
    }, holdDelay);

    const skeletonTimer = showSkeleton
      ? setTimeout(() => {
          setPhase("spinner");
        }, holdDelay + 1500) // Show skeleton for 1.5 seconds
      : null;

    return () => {
      clearTimeout(holdTimer);
      if (skeletonTimer) clearTimeout(skeletonTimer);
    };
  }, [holdDelay, showSkeleton]);

  if (phase === "holding") {
    return null; // Show nothing during hold
  }

  if (phase === "skeleton") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ContentSkeleton layout={skeletonLayout} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-[200px]"
      >
        <div className="flex flex-col items-center space-y-4">
          <Loader />
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Instant loading component for routes with cached data
export function InstantLoading({
  message = "Loading...",
  showProgress = false,
}: {
  message?: string;
  showProgress?: boolean;
}) {
  if (showProgress) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-primary-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-[100px]"
    >
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </motion.div>
  );
}
