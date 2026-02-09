import React from "react";
import { motion } from "motion/react";
import { cn } from "./ui";
import { Card } from "./Cards";

interface ShoeCardSkeletonProps {
  className?: string;
  index?: number;
}

export function ShoeCardSkeleton({
  className,
  index = 0,
}: ShoeCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={className}
    >
      <Card
        className="h-full overflow-hidden flex flex-row md:flex-col md:h-auto"
        padding="none"
        shadow="soft"
        rounded="lg"
      >
        {/* Image Skeleton */}
        <div className="relative w-44 h-full md:w-full md:h-auto md:aspect-[4/3] flex-shrink-0 overflow-hidden bg-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
          </div>

          {/* Floating elements for visual interest */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
          <div className="absolute top-6 right-6 w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
          <div className="absolute bottom-4 left-6 w-4 h-4 bg-gray-300 rounded-full animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="p-4 md:p-6 bg-white space-y-4 flex-1 flex flex-col justify-between">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                {/* Title skeleton */}
                <div
                  className="h-5 bg-gray-200 rounded-lg animate-pulse"
                  style={{ width: "75%" }}
                />
                {/* Subtitle skeleton */}
                <div
                  className="h-4 bg-gray-150 rounded-md animate-pulse"
                  style={{ width: "60%" }}
                />
              </div>
              {/* Premium badge skeleton */}
              <div className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse" />
            </div>

            {/* Collection badge skeleton */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse" />
              <div
                className="h-3 bg-gray-200 rounded-full animate-pulse"
                style={{ width: "80px" }}
              />
            </div>
          </div>

          {/* Usage Progress Section */}
          <div className="space-y-4">
            {/* Mileage Display */}
            <div className="flex justify-between items-center">
              <div
                className="h-4 bg-gray-200 rounded-md animate-pulse"
                style={{ width: "60px" }}
              />
              <div
                className="h-4 bg-gray-200 rounded-md animate-pulse"
                style={{ width: "100px" }}
              />
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${45 + ((index * 15) % 40)}%` }}
                  transition={{
                    duration: 1.2,
                    delay: index * 0.2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  {/* Shimmer effect on progress bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              {/* Usage percentage skeleton */}
              <div className="absolute -top-6 right-0 w-8 h-3 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Status and Remaining Miles */}
            <div className="flex items-center justify-between pt-2">
              {/* Status badge skeleton */}
              <div
                className="h-6 bg-gray-200 rounded-full animate-pulse"
                style={{ width: "90px" }}
              />

              {/* Remaining miles skeleton */}
              <div className="text-right space-y-1">
                <div
                  className="h-4 bg-gray-200 rounded animate-pulse"
                  style={{ width: "50px" }}
                />
                <div
                  className="h-3 bg-gray-150 rounded animate-pulse"
                  style={{ width: "60px" }}
                />
              </div>
            </div>

            {/* Additional details skeleton */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div
                className="h-3 bg-gray-200 rounded animate-pulse"
                style={{ width: "60px" }}
              />
              <div
                className="h-3 bg-gray-200 rounded animate-pulse"
                style={{ width: "40px" }}
              />
            </div>
          </div>
        </div>

        {/* Subtle animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 animate-pulse opacity-20 pointer-events-none rounded-2xl" />
      </Card>
    </motion.div>
  );
}

// Multiple skeleton cards for grid loading
interface ShoeCardSkeletonsProps {
  count?: number;
  className?: string;
}

export function ShoeCardSkeletons({
  count = 6,
  className,
}: ShoeCardSkeletonsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <ShoeCardSkeleton key={index} index={index} className="h-full" />
      ))}
    </div>
  );
}
