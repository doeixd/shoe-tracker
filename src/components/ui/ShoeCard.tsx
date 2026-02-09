import React from "react";
import { motion } from "motion/react";
import {
  Gauge,
  AlertTriangle,
  Footprints,
  Package,
  Image as ImageIcon,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "./ui";
import { Card } from "./Cards";
import { ShoeImage } from "./EnhancedImage";
import {
  formatDistance,
  USAGE_LEVEL_COLORS,
  USAGE_LEVEL_LABELS,
  type Shoe,
  type Collection,
  type UsageLevel,
} from "~/types";

interface ShoeCardProps {
  shoe: Shoe;
  collection?: Collection;
  currentMileage: number;
  usageLevel: UsageLevel;
  usagePercentage: number;
  onClick?: () => void;
  className?: string;
  index?: number;
}

export function ShoeCard({
  shoe,
  collection,
  currentMileage,
  usageLevel,
  usagePercentage,
  onClick,
  className,
  index = 0,
}: ShoeCardProps) {
  const milesRemaining = Math.max(0, shoe.maxMileage - currentMileage);

  return (
    <div className={className}>
      <Card
        className={cn(
          "mt-0 group relative overflow-hidden transition-all duration-300 h-full",
          "hover:shadow-glow hover:-translate-y-1",
          "w-full",
          "flex flex-row md:flex-col md:h-auto", // Horizontal layout on mobile, vertical on desktop
          shoe.isRetired ? "opacity-80 hover:opacity-100" : "",
        )}
        hover={!!onClick}
        onClick={onClick}
        padding="none"
        shadow="medium"
        rounded="3xl"
      >
        {/* Retired overlay */}
        {shoe.isRetired && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium px-3 py-1 text-center">
            RETIRED
          </div>
        )}

        {/* Image Section */}
        <div className="relative overflow-hidden w-44 h-full md:w-full md:h-auto md:aspect-[4/3] flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200">
          <ShoeImage
            src={shoe.imageUrl}
            alt={shoe.name || "Shoe"}
            className="transition-all duration-700 group-hover:scale-110 group-hover:brightness-110 object-cover"
            shoeBrand={shoe.brand}
            shoeModel={shoe.model}
          />

          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-purple-500/10 opacity-60 group-hover:opacity-80 transition-all duration-500" />

          {/* Subtle border highlight on hover */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 transition-all duration-300" />

          {/* Usage Level Badge - Top Left */}
          <div className="absolute top-2 left-2 z-20">
            <motion.span
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-lg border backdrop-blur-md",
                usageLevel === "new"
                  ? "bg-blue-50/95 text-blue-800 border-blue-200/60 shadow-blue-500/20"
                  : usageLevel === "good"
                    ? "bg-green-50/95 text-green-800 border-green-200/60 shadow-green-500/20"
                    : usageLevel === "moderate"
                      ? "bg-yellow-50/95 text-yellow-800 border-yellow-200/60 shadow-yellow-500/20"
                      : usageLevel === "high"
                        ? "bg-orange-50/95 text-orange-800 border-orange-200/60 shadow-orange-500/20"
                        : "bg-red-50/95 text-red-800 border-red-200/60 shadow-red-500/20",
              )}
              whileHover={{ scale: 1.05, y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {usageLevel === "replace" && (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {usageLevel === "new" && <Sparkles className="w-3 h-3 mr-1" />}
              {USAGE_LEVEL_LABELS[usageLevel]}
            </motion.span>
          </div>

          {/* Collection badge overlay */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {collection && (
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-soft">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: collection.color || "#3b82f6" }}
                />
                <span className="text-xs font-medium text-gray-700 truncate max-w-20">
                  {collection.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 md:p-6 bg-white flex-1 flex flex-col justify-between w-full">
          {/* Header */}
          <div className="mb-2 md:mb-4">
            <div className="flex items-start justify-between mb-1 md:mb-2">
              <div className="flex-1 min-w-0">
                <motion.h3
                  className="text-sm md:text-lg font-bold text-gray-900 truncate group-hover:text-primary-600 transition-all duration-300"
                  whileHover={{ x: 2 }}
                >
                  {shoe.name || "Unnamed Shoe"}
                </motion.h3>
                <p className="text-xs md:text-sm text-gray-600 font-medium tracking-wide">
                  {shoe.brand || "Unknown"} {shoe.model && `• ${shoe.model}`}
                </p>
              </div>

              {/* Premium badge for high-end shoes */}
              {shoe.purchasePrice && shoe.purchasePrice > 150 && (
                <motion.div
                  className="flex-shrink-0 ml-2"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Star className="w-3 h-3 text-white drop-shadow-sm" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Collection badge - always visible */}
            {collection && (
              <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 justify-center md:justify-start">
                <div
                  className="w-2.5 md:w-3 h-2.5 md:h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: collection.color || "#3b82f6" }}
                />
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                  {collection.name}
                </span>
              </div>
            )}
          </div>

          {/* Usage Progress Section */}
          <div className="space-y-2 md:space-y-4">
            {/* Progress Label */}
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-gray-600 flex items-center gap-1 md:gap-1.5 font-medium">
                <Gauge className="w-3 md:w-4 h-3 md:h-4" />
                <span className="hidden md:inline">Usage Progress</span>
                <span className="md:hidden">Usage</span>
              </span>
              <span className="text-xs font-medium text-gray-500">
                {Math.round(usagePercentage)}% /{" "}
                {formatDistance(currentMileage)}
              </span>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden shadow-inner relative">
                <motion.div
                  className={cn(
                    "h-full rounded-full relative overflow-hidden transition-all duration-300",
                    usageLevel === "new" || usageLevel === "good"
                      ? "bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-green-500/30"
                      : usageLevel === "moderate"
                        ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-yellow-500/30"
                        : usageLevel === "high"
                          ? "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-orange-500/30"
                          : "bg-gradient-to-r from-red-400 via-red-500 to-red-600 shadow-red-500/30",
                  )}
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, usagePercentage)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
                </motion.div>

                {/* Warning indicator for replacement */}
                {usageLevel === "replace" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-red-700" />
                  </div>
                )}
              </div>
            </div>

            {/* Remaining Miles */}
            <div className="flex justify-end pt-1 md:pt-2">
              <motion.div
                className="text-right"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-xs md:text-sm font-bold text-gray-900 flex items-center justify-end gap-1">
                  <span className="text-sm md:text-lg">
                    {milesRemaining.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-500 font-normal">mi</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  remaining
                </div>
              </motion.div>
            </div>

            {/* Purchase price only if available */}
            {shoe.purchasePrice && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500 text-center">
                  ${shoe.purchasePrice}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/8 group-hover:to-purple-500/8 transition-all duration-700 pointer-events-none rounded-3xl" />

        {/* Subtle inner glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-3xl" />
        </div>
      </Card>
    </div>
  );
}

// Note: Shimmer animation styles are now defined in app.css
