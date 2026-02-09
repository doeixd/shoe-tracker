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

  const progressColor =
    usageLevel === "new" || usageLevel === "good"
      ? "bg-emerald-500"
      : usageLevel === "moderate"
        ? "bg-amber-500"
        : usageLevel === "high"
          ? "bg-orange-500"
          : "bg-red-500";

  const badgeStyle =
    usageLevel === "new"
      ? "bg-blue-50 text-blue-700 ring-blue-200/60"
      : usageLevel === "good"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
        : usageLevel === "moderate"
          ? "bg-amber-50 text-amber-700 ring-amber-200/60"
          : usageLevel === "high"
            ? "bg-orange-50 text-orange-700 ring-orange-200/60"
            : "bg-red-50 text-red-700 ring-red-200/60";

  return (
    <div className={className}>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-200 h-full",
          "hover:shadow-large hover:-translate-y-0.5",
          "w-full",
          "flex flex-row md:flex-col md:h-auto",
          shoe.isRetired ? "opacity-75 hover:opacity-100" : "",
        )}
        hover={!!onClick}
        onClick={onClick}
        padding="none"
        shadow="soft"
        rounded="2xl"
      >
        {/* Retired overlay */}
        {shoe.isRetired && (
          <div className="absolute top-0 left-0 right-0 z-20 bg-gray-900/80 text-white text-[10px] font-semibold tracking-wider px-3 py-1 text-center uppercase">
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
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 backdrop-blur-sm",
                badgeStyle,
              )}
            >
              {usageLevel === "replace" && (
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              )}
              {usageLevel === "new" && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
              {USAGE_LEVEL_LABELS[usageLevel]}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3.5 md:p-5 bg-white flex-1 flex flex-col justify-between w-full min-w-0">
          {/* Header */}
          <div className="mb-2 md:mb-3">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {shoe.name || "Unnamed Shoe"}
            </h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {shoe.brand || "Unknown"}{shoe.model ? ` ${shoe.model}` : ""}
            </p>

            {/* Collection badge */}
            {collection && (
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: collection.color || "#3b82f6" }}
                />
                <span className="text-[11px] text-gray-500 truncate">
                  {collection.name}
                </span>
              </div>
            )}
          </div>

          {/* Usage Progress Section */}
          <div className="space-y-2">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-gray-500 font-medium">
                  {formatDistance(currentMileage)} mi
                </span>
                <span className="text-[11px] text-gray-400">
                  {Math.round(usagePercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", progressColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, usagePercentage)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Remaining */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                {milesRemaining.toFixed(0)} mi remaining
              </span>
              {shoe.purchasePrice && (
                <span className="text-[11px] text-gray-400">
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
