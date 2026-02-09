import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { cn } from "~/components/ui/ui";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";

interface PageHeaderProps {
  /**
   * The main title of the page
   */
  title: string;

  /**
   * Optional description text below the title
   */
  description?: string;

  /**
   * Optional icon to display next to the title
   */
  // icon?: LucideIcon;

  /**
   * Whether to use gradient styling for the title
   */
  gradient?: boolean;

  /**
   * Additional action buttons or controls to display on the right
   */
  actions?: React.ReactNode;

  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Whether to animate on first visit
   */
  animate?: boolean;

  /**
   * Custom icon color (defaults to primary gradient)
   */
  // iconColor?: string;

  /**
   * Size variant
   */
  size?: "default" | "large";
}

export function PageHeader({
  title,
  description,
  // icon: Icon,
  gradient = false,
  actions,
  className,
  animate = true,
  // iconColor,
  size = "default",
}: PageHeaderProps) {
  const { isFirstVisit } = useFirstVisit();

  const titleClasses = cn(
    // Base styles
    "font-bold leading-tight tracking-tight",
    // Size variants
    size === "large"
      ? "text-3xl sm:text-4xl"
      : "text-2xl sm:text-3xl",
    // Color variants
    gradient
      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
      : "text-gray-900",
  );

  const containerAnimation = animate
    ? getAnimationProps(isFirstVisit, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      })
    : {};

  const titleAnimation = animate
    ? getAnimationProps(isFirstVisit, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.1 },
      })
    : {};

  const descriptionAnimation = animate
    ? getAnimationProps(isFirstVisit, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.2 },
      })
    : {};

  return (
    <motion.div
      {...containerAnimation}
      className={cn(
        "flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6",
        className,
      )}
    >
      {/* Title Section */}
      <div className="flex gap-6 items-start flex-1">
        {/* {Icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl shadow-soft flex-shrink-0 mt-0.5",
              size === "large" ? "w-14 h-14" : "w-12 h-12",
              iconColor || "bg-gradient-to-br from-primary-500 to-blue-600",
            )}
          >
            <Icon
              className={cn(
                "text-white",
                size === "large" ? "w-7 h-7" : "w-6 h-6",
              )}
            />
          </div>
        )} */}
        <div className="space-y-2 sm:space-y-3">
          <motion.h1 {...titleAnimation} className={titleClasses}>
            {title}
          </motion.h1>

          {description && (
            <motion.p
              {...descriptionAnimation}
              className={cn(
                "text-gray-500 leading-relaxed text-balance",
                size === "large"
                  ? "text-base sm:text-lg"
                  : "text-sm sm:text-base",
              )}
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>

      {/* Actions Section */}
      {actions && (
        <motion.div
          {...(animate
            ? getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.5, delay: 0.3 },
              })
            : {})}
          className="w-full sm:w-auto"
        >
          {React.isValidElement(actions)
            ? React.cloneElement(actions as React.ReactElement<any>, {
                className: cn(
                  (actions as React.ReactElement<any>).props.className,
                  "w-full sm:w-auto",
                ),
              })
            : actions}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Preset page header configurations for common use cases
 */
export const PageHeaderPresets = {
  /**
   * Standard page header with icon and description
   */
  standard: (props: Omit<PageHeaderProps, "gradient" | "size">) => (
    <PageHeader {...props} gradient={false} size="default" />
  ),

  /**
   * Enhanced page header with gradient title and larger size
   */
  enhanced: (props: Omit<PageHeaderProps, "gradient" | "size">) => (
    <PageHeader {...props} gradient={true} size="large" />
  ),

  /**
   * Simple page header without icon
   */
  simple: (props: Omit<PageHeaderProps, "icon" | "gradient" | "size">) => (
    <PageHeader {...props} gradient={false} size="default" />
  ),
} as const;

/**
 * Container component for consistent page layout with header
 */
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in relative z-10 max-w-7xl mx-auto w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
