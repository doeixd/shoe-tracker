import React from "react";
import { motion } from "motion/react";
import { cn } from "./ui";

// Base Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "soft" | "medium" | "large" | "glow";
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  border?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  noAnimation?: boolean;
}

export function Card({
  children,
  className,
  hover = false,
  padding = "md",
  shadow = "soft",
  rounded = "2xl",
  border = true,
  gradient = false,
  onClick,
  noAnimation = false,
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-6",
    lg: "p-4 sm:p-6",
    xl: "p-6 sm:p-6",
  };

  const shadowClasses = {
    none: "",
    soft: "shadow-soft",
    medium: "shadow-medium",
    large: "shadow-large",
    glow: "shadow-glow",
  };

  const roundedClasses = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    "2xl": "rounded-3xl",
    "3xl": "rounded-3xl",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={cn(
        "bg-white will-change-transform",
        noAnimation ? "" : "animate-fade-in-fast",
        paddingClasses[padding],
        shadowClasses[shadow],
        roundedClasses[rounded],
        border ? "border border-gray-100" : "",
        gradient ? "bg-gradient-to-br from-white to-gray-50/50" : "",
        hover ? "card-hover cursor-pointer" : "",
        onClick ? "focus:outline-none focus:ring-2 focus:ring-primary-500" : "",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}

// Metric Card for stats and numbers
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: "primary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "neutral",
  className,
}: MetricCardProps) {
  const colorClasses = {
    primary: "text-primary-600",
    success: "text-green-600",
    warning: "text-orange-600",
    danger: "text-red-600",
    neutral: "text-gray-500",
  };

  const trendColorClasses = trend?.positive
    ? "text-green-600 bg-green-50"
    : "text-red-600 bg-red-50";

  return (
    <Card className={cn("@container", className)} hover padding="md">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              "flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5",
              colorClasses[color],
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl @[120px]:text-xl @[100px]:text-lg font-display font-bold text-gray-900">
              {value}
            </span>
            {subtitle && (
              <span className="text-xs text-gray-400">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              trendColorClasses,
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
    </Card>
  );
}

// Feature Card for showcasing features or items
interface FeatureCardProps {
  title: string;
  description?: string;
  image?: string;
  badge?: string;
  badgeColor?: "primary" | "success" | "warning" | "danger";
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function FeatureCard({
  title,
  description,
  image,
  badge,
  badgeColor = "primary",
  onClick,
  className,
  children,
}: FeatureCardProps) {
  const badgeColorClasses = {
    primary: "bg-primary-100 text-primary-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-orange-100 text-orange-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <Card
      className={className}
      hover={!!onClick}
      onClick={onClick}
      padding="none"
      shadow="medium"
    >
      {image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-2xl bg-gray-100 flex items-center justify-center">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div class="text-center">
                      <div class="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p class="text-xs text-gray-500">${title}</p>
                    </div>
                  </div>
                `;
              }
            }}
            loading="lazy"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-3">
            {title}
          </h3>
          {badge && (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                badgeColorClasses[badgeColor],
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {children}
      </div>
    </Card>
  );
}

// Stats Card for displaying multiple metrics
interface StatsCardProps {
  title: string;
  stats: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  className?: string;
}

export function StatsCard({ title, stats, className }: StatsCardProps) {
  return (
    <Card className={className} padding="lg" shadow="medium">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Action Card with primary action button
interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  variant = "primary",
  className,
}: ActionCardProps) {
  const variantClasses = {
    primary: "bg-gray-900 text-white",
    secondary: "bg-white border border-gray-200",
  };

  const textClasses = {
    primary: "text-gray-400",
    secondary: "text-gray-500",
  };

  return (
    <div
      className={cn(
        "p-5 rounded-2xl card-hover will-change-transform",
        variantClasses[variant],
        className,
      )}
    >
      {icon && (
        <div className={cn(
          "w-10 h-10 mb-3 flex items-center justify-center rounded-xl",
          variant === "primary" ? "bg-white/10" : "bg-gray-100",
        )}>
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "text-base font-display font-semibold mb-1",
          variant === "primary" ? "text-white" : "text-gray-900",
        )}
      >
        {title}
      </h3>
      <p className={cn("text-sm mb-4", textClasses[variant])}>{description}</p>
      <button
        onClick={onAction}
        className={cn(
          "w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200",
          variant === "primary"
            ? "bg-white text-gray-900 hover:bg-gray-100"
            : "bg-gray-900 text-white hover:bg-gray-800",
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

// Empty State Card
interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateCard({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateCardProps) {
  return (
    <Card className={cn("text-center", className)} padding="lg">
      {icon && (
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl bg-gray-100">
          {icon}
        </div>
      )}
      <h3 className="text-base font-display font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
        >
          {actionLabel}
        </button>
      )}
    </Card>
  );
}

// Loading Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)} padding="lg">
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </Card>
  );
}

// Card Grid Layout
interface CardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function CardGrid({
  children,
  cols = 3,
  gap = "md",
  className,
}: CardGridProps) {
  const colsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  return (
    <div className={cn("grid", colsClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
}
