import React from "react";
import { motion } from "motion/react";

// Base skeleton component with improved animation
function SkeletonBox({
  className = "",
  animate = true,
  delay = 0
}: {
  className?: string;
  animate?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0.6 } : {}}
      animate={animate ? { opacity: [0.6, 1, 0.6] } : {}}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      } : {}}
      className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
    />
  );
}

// Dashboard/Home page skeleton
export function DashboardSkeleton({ animate = true }: { animate?: boolean }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-safe">
      <div className="max-w-7xl mx-auto p-4 space-y-8">
        {/* Header skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-3">
            <SkeletonBox className="h-10 w-48" animate={animate} />
            <SkeletonBox className="h-6 w-80" animate={animate} delay={0.1} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <SkeletonBox className="h-10 w-28" animate={animate} delay={0.2} />
            <SkeletonBox className="h-10 w-24" animate={animate} delay={0.3} />
          </div>
        </motion.div>

        {/* Stats Grid skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[0, 1, 2, 3].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <SkeletonBox className="w-12 h-12 rounded-2xl" animate={animate} delay={index * 0.1} />
                </div>
                <div className="space-y-2">
                  <SkeletonBox className="h-8 w-16" animate={animate} delay={index * 0.1 + 0.1} />
                  <SkeletonBox className="h-4 w-20" animate={animate} delay={index * 0.1 + 0.2} />
                  <SkeletonBox className="h-3 w-24" animate={animate} delay={index * 0.1 + 0.3} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Two-column content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Collections skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Collections header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonBox className="w-10 h-10 rounded-2xl" animate={animate} />
                <SkeletonBox className="h-8 w-32" animate={animate} delay={0.1} />
              </div>
              <SkeletonBox className="h-6 w-20" animate={animate} delay={0.2} />
            </div>

            {/* Collections list */}
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.15,
                    delay: index * 0.03,
                    ease: "easeOut",
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-soft"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <SkeletonBox className="w-4 h-4 rounded-full" animate={animate} delay={index * 0.05} />
                    <div className="space-y-2 flex-1 min-w-0">
                      <SkeletonBox className="h-5 w-32" animate={animate} delay={index * 0.05 + 0.1} />
                      <SkeletonBox className="h-4 w-48" animate={animate} delay={index * 0.05 + 0.2} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-6 w-12" animate={animate} delay={index * 0.05 + 0.3} />
                    <SkeletonBox className="w-5 h-5" animate={animate} delay={index * 0.05 + 0.4} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent shoes skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Recent shoes header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonBox className="w-10 h-10 rounded-2xl" animate={animate} />
                <SkeletonBox className="h-8 w-36" animate={animate} delay={0.1} />
              </div>
              <SkeletonBox className="h-6 w-20" animate={animate} delay={0.2} />
            </div>

            {/* Recent shoes grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <SkeletonBox className="w-12 h-12 rounded-2xl" animate={animate} delay={index * 0.1} />
                    <div className="flex-1 space-y-2">
                      <SkeletonBox className="h-5 w-24" animate={animate} delay={index * 0.1 + 0.1} />
                      <SkeletonBox className="h-4 w-16" animate={animate} delay={index * 0.1 + 0.2} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <SkeletonBox className="h-4 w-16" animate={animate} delay={index * 0.1 + 0.3} />
                      <SkeletonBox className="h-4 w-12" animate={animate} delay={index * 0.1 + 0.4} />
                    </div>
                    <SkeletonBox className="h-2 w-full rounded-full" animate={animate} delay={index * 0.1 + 0.5} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Shoes listing page skeleton
export function ShoesListingSkeleton({ animate = true }: { animate?: boolean }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-safe">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBox className="h-10 w-32" animate={animate} />
            <SkeletonBox className="h-5 w-64" animate={animate} delay={0.1} />
          </div>
          <SkeletonBox className="h-10 w-28" animate={animate} delay={0.2} />
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100">
          <div className="flex flex-wrap gap-4">
            <SkeletonBox className="h-10 w-32" animate={animate} />
            <SkeletonBox className="h-10 w-24" animate={animate} delay={0.1} />
            <SkeletonBox className="h-10 w-28" animate={animate} delay={0.2} />
            <SkeletonBox className="h-10 w-20" animate={animate} delay={0.3} />
          </div>
        </div>

        {/* Shoes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <div className="space-y-4">
                {/* Shoe image */}
                <SkeletonBox className="h-40 w-full rounded-xl" animate={animate} delay={index * 0.1} />

                {/* Shoe details */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <SkeletonBox className="h-6 w-32" animate={animate} delay={index * 0.1 + 0.1} />
                      <SkeletonBox className="h-4 w-24" animate={animate} delay={index * 0.1 + 0.2} />
                    </div>
                    <SkeletonBox className="w-8 h-8 rounded-full" animate={animate} delay={index * 0.1 + 0.3} />
                  </div>

                  {/* Mileage bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <SkeletonBox className="h-3 w-16" animate={animate} delay={index * 0.1 + 0.4} />
                      <SkeletonBox className="h-3 w-12" animate={animate} delay={index * 0.1 + 0.5} />
                    </div>
                    <SkeletonBox className="h-3 w-full rounded-full" animate={animate} delay={index * 0.1 + 0.6} />
                  </div>

                  {/* Status badge */}
                  <SkeletonBox className="h-6 w-16 rounded-full" animate={animate} delay={index * 0.1 + 0.7} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Collections/Runs listing skeleton
export function ListingSkeleton({
  animate = true,
  title = "Loading...",
  showFilters = true
}: {
  animate?: boolean;
  title?: string;
  showFilters?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-safe">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBox className="h-10 w-40" animate={animate} />
            <SkeletonBox className="h-5 w-72" animate={animate} delay={0.1} />
          </div>
          <SkeletonBox className="h-10 w-32" animate={animate} delay={0.2} />
        </div>

        {/* Filters (if enabled) */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100">
            <div className="flex flex-wrap gap-4">
              <SkeletonBox className="h-10 w-28" animate={animate} />
              <SkeletonBox className="h-10 w-24" animate={animate} delay={0.1} />
              <SkeletonBox className="h-10 w-32" animate={animate} delay={0.2} />
            </div>
          </div>
        )}

        {/* List items */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <SkeletonBox className="w-12 h-12 rounded-2xl" animate={animate} delay={index * 0.1} />
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-6 w-48" animate={animate} delay={index * 0.1 + 0.1} />
                  <SkeletonBox className="h-4 w-64" animate={animate} delay={index * 0.1 + 0.2} />
                  <div className="flex gap-4">
                    <SkeletonBox className="h-4 w-20" animate={animate} delay={index * 0.1 + 0.3} />
                    <SkeletonBox className="h-4 w-16" animate={animate} delay={index * 0.1 + 0.4} />
                    <SkeletonBox className="h-4 w-24" animate={animate} delay={index * 0.1 + 0.5} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-8 w-16" animate={animate} delay={index * 0.1 + 0.6} />
                  <SkeletonBox className="w-6 h-6" animate={animate} delay={index * 0.1 + 0.7} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Detail page skeleton
export function DetailPageSkeleton({ animate = true }: { animate?: boolean }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-blue-50/30 pb-safe">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <SkeletonBox className="w-10 h-10 rounded-2xl" animate={animate} />
          <div className="space-y-2 flex-1">
            <SkeletonBox className="h-8 w-64" animate={animate} delay={0.1} />
            <SkeletonBox className="h-5 w-32" animate={animate} delay={0.2} />
          </div>
          <SkeletonBox className="h-10 w-20" animate={animate} delay={0.3} />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero section */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <SkeletonBox className="h-64 w-full rounded-xl mb-6" animate={animate} />
              <div className="space-y-4">
                <SkeletonBox className="h-8 w-48" animate={animate} delay={0.1} />
                <SkeletonBox className="h-5 w-full" animate={animate} delay={0.2} />
                <SkeletonBox className="h-5 w-3/4" animate={animate} delay={0.3} />
              </div>
            </div>

            {/* Stats section */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <SkeletonBox className="h-6 w-24 mb-4" animate={animate} />
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="space-y-2">
                    <SkeletonBox className="h-4 w-20" animate={animate} delay={index * 0.1} />
                    <SkeletonBox className="h-6 w-16" animate={animate} delay={index * 0.1 + 0.1} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <SkeletonBox className="h-6 w-24 mb-4" animate={animate} />
              <div className="space-y-3">
                <SkeletonBox className="h-10 w-full" animate={animate} delay={0.1} />
                <SkeletonBox className="h-10 w-full" animate={animate} delay={0.2} />
              </div>
            </div>

            {/* Info panel */}
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <SkeletonBox className="h-6 w-20 mb-4" animate={animate} />
              <div className="space-y-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex justify-between items-center">
                    <SkeletonBox className="h-4 w-24" animate={animate} delay={index * 0.1} />
                    <SkeletonBox className="h-4 w-16" animate={animate} delay={index * 0.1 + 0.1} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact skeleton for navigation loading
export function NavigationSkeleton({ animate = true }: { animate?: boolean }) {
  return (
    <div className="flex items-center justify-center min-h-[60px]">
      <div className="flex items-center space-x-3">
        <SkeletonBox className="w-6 h-6 rounded-full" animate={animate} />
        <SkeletonBox className="h-4 w-24" animate={animate} delay={0.1} />
      </div>
    </div>
  );
}
