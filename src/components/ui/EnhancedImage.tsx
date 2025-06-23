import React, { useState } from "react";
import { motion } from "motion/react";
import { Footprints, Loader2, ImageIcon } from "lucide-react";
import { cn } from "./ui";

interface EnhancedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackContent?: React.ReactNode;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: () => void;
  showLoadingState?: boolean;
  shoeBrand?: string;
  shoeModel?: string;
}

export function EnhancedImage({
  src,
  alt,
  className = "",
  fallbackContent,
  aspectRatio = "video",
  loading = "lazy",
  onLoad,
  onError,
  showLoadingState = true,
  shoeBrand,
  shoeModel,
}: EnhancedImageProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error",
  );

  const aspectRatioClasses = {
    square: "w-full h-full",
    video: "w-full h-full",
    portrait: "w-full h-full",
    wide: "w-full h-full",
  };

  const handleImageLoad = () => {
    setImageState("loaded");
    onLoad?.();
  };

  const handleImageError = () => {
    setImageState("error");
    onError?.();
  };

  const renderFallback = () => {
    if (fallbackContent) {
      return fallbackContent;
    }

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center overflow-hidden">
        {/* Enhanced background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/8 via-transparent to-purple-500/8" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
                               radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 40%),
                               radial-gradient(circle at 40% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 30%)`,
            }}
          />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        {/* Enhanced shoe silhouette */}
        <motion.div
          className="relative z-10 text-center w-full h-full flex flex-col items-center justify-center p-3"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Icon container with enhanced styling */}
          <div className="relative mb-2 sm:mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0 backdrop-blur-sm border border-white/20">
              <Footprints className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-sm" />
            </div>
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-2xl sm:rounded-3xl blur-sm -z-10" />
          </div>

          {/* Enhanced text container */}
          <div className="space-y-1 min-w-0 w-full px-2 text-center">
            <motion.p
              className="text-xs sm:text-sm font-semibold text-gray-800 truncate leading-tight"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {shoeBrand || "Unknown Brand"}
            </motion.p>
            <motion.p
              className="text-xs text-gray-600 truncate leading-tight font-medium"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {shoeModel || "Unknown Model"}
            </motion.p>
          </div>

          {/* Subtle accent line */}
          <motion.div
            className="w-8 h-0.5 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full mt-2 opacity-60"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 32, opacity: 0.6 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          />
        </motion.div>

        {/* Corner accent elements */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary-300/30 rounded-tl-lg" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-purple-300/30 rounded-br-lg" />
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
        <p className="text-xs text-gray-500">Loading image...</p>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gray-50 w-full h-full",
        className,
      )}
    >
      {src && imageState !== "error" && (
        <>
          {showLoadingState && imageState === "loading" && renderLoadingState()}
          <motion.img
            src={src}
            alt={alt}
            loading={loading}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              imageState === "loaded"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105",
              className,
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{
              opacity: imageState === "loaded" ? 1 : 0,
              scale: imageState === "loaded" ? 1 : 1.05,
            }}
            transition={{ duration: 0.3 }}
          />
        </>
      )}

      {(!src || imageState === "error") && renderFallback()}

      {/* Optional overlay for hover effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

// Preset configurations for common use cases
export const ShoeImage = (props: Omit<EnhancedImageProps, "aspectRatio">) => (
  <EnhancedImage {...props} aspectRatio="video" />
);

export const ProfileImage = (
  props: Omit<EnhancedImageProps, "aspectRatio">,
) => <EnhancedImage {...props} aspectRatio="square" />;

export const BannerImage = (props: Omit<EnhancedImageProps, "aspectRatio">) => (
  <EnhancedImage {...props} aspectRatio="wide" />
);
