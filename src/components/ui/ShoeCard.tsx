import React from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "./ui";
import { Card } from "./Cards";
import { ShoeImage } from "./EnhancedImage";
import {
  formatDistance,
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
          <div className="absolute top-0 left-0 right-0 z-20 bg-gray-900 text-white text-[10px] font-semibold tracking-wider px-3 py-0.5 text-center uppercase">
            Retired
          </div>
        )}

        {/* Image Section */}
        <div className="relative overflow-hidden w-36 h-full md:w-full md:h-auto md:aspect-[4/3] flex-shrink-0 bg-gray-100">
          <ShoeImage
            src={shoe.imageUrl}
            alt={shoe.name || "Shoe"}
            className="transition-transform duration-500 group-hover:scale-105 object-cover"
            shoeBrand={shoe.brand}
            shoeModel={shoe.model}
          />

          {/* Usage Level Badge */}
          <div className="absolute top-2 left-2 z-20">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ring-1 ring-inset",
                usageLevel === "new"
                  ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                  : usageLevel === "good"
                    ? "bg-green-50 text-green-700 ring-green-600/20"
                    : usageLevel === "moderate"
                      ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                      : usageLevel === "high"
                        ? "bg-orange-50 text-orange-700 ring-orange-600/20"
                        : "bg-red-50 text-red-700 ring-red-600/20",
              )}
            >
              {usageLevel === "replace" && (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {usageLevel === "new" && <Sparkles className="w-3 h-3 mr-1" />}
              {USAGE_LEVEL_LABELS[usageLevel]}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 md:p-5 bg-white flex-1 flex flex-col justify-between w-full">
          {/* Header */}
          <div className="mb-2 md:mb-3">
            <div className="flex items-start justify-between mb-0.5 md:mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-display font-bold text-gray-900 truncate">
                  {shoe.name || "Unnamed Shoe"}
                </h3>
                <p className="text-xs text-gray-500">
                  {shoe.brand || "Unknown"} {shoe.model && `· ${shoe.model}`}
                </p>
              </div>
            </div>

            {collection && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: collection.color || "#3b82f6" }}
                />
                <span className="text-xs text-gray-500">
                  {collection.name}
                </span>
              </div>
            )}
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {formatDistance(currentMileage)} mi
              </span>
              <span className="text-xs font-medium text-gray-900">
                {Math.round(usagePercentage)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  usageLevel === "new" || usageLevel === "good"
                    ? "bg-green-500"
                    : usageLevel === "moderate"
                      ? "bg-yellow-500"
                      : usageLevel === "high"
                        ? "bg-orange-500"
                        : "bg-red-500",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, usagePercentage)}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              />
            </div>

            {/* Remaining */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {milesRemaining.toFixed(0)} mi left
              </span>
              {shoe.purchasePrice && (
                <span className="text-xs text-gray-400">
                  ${shoe.purchasePrice}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Note: Shimmer animation styles are now defined in app.css
