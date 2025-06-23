import {
  forwardRef,
  HTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: (string | undefined)[]) {
  return twMerge(clsx(inputs));
}

// Export new card components from Cards.tsx
export * from "./Cards";

// Card Components
const cardVariants = cva(
  "rounded-xl border bg-white text-gray-900 shadow-soft transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200/60 shadow-soft",
        secondary: "bg-gray-50/80 border-gray-200/60 shadow-soft",
        outline:
          "border-2 border-dashed border-gray-300 bg-transparent shadow-none",
        glass: "glass border-white/20 text-gray-900",
        gradient:
          "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-blue-200/30",
      },
      size: {
        default: "",
        sm: "text-sm",
        lg: "text-lg",
      },
      hover: {
        default: "",
        lift: "card-hover cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      hover: "default",
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, hover, className }))}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 p-4 sm:p-6", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg sm:text-xl font-bold leading-tight tracking-tight text-gray-900",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-4 sm:p-6 pt-0", className)}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

// Badge Component
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500 text-white shadow-sm hover:bg-primary-600",
        secondary:
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
        destructive:
          "border-transparent bg-danger-500 text-white hover:bg-danger-600",
        outline: "text-gray-700 border-gray-300 hover:bg-gray-50",
        success:
          "border-transparent bg-success-100 text-success-800 hover:bg-success-200",
        warning:
          "border-transparent bg-warning-100 text-warning-800 hover:bg-warning-200",
        info: "border-transparent bg-primary-100 text-primary-800 hover:bg-primary-200",
        gradient:
          "border-transparent gradient-primary text-white shadow-md hover:shadow-lg",
      },
      size: {
        default: "px-2.5 py-1 text-xs",
        sm: "px-2 py-0.5 text-2xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Button Component
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 text-white shadow-md hover:bg-primary-600 hover:shadow-lg button-hover",
        destructive:
          "bg-danger-500 text-white shadow-md hover:bg-danger-600 hover:shadow-lg button-hover",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 text-gray-700",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
        link: "text-primary-500 underline-offset-4 hover:underline hover:text-primary-600",
        gradient:
          "gradient-primary text-white shadow-lg hover:shadow-xl button-hover",
        success:
          "bg-success-500 text-white shadow-md hover:bg-success-600 hover:shadow-lg button-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// Progress Component
interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "default" | "lg";
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      size = "default",
      ...props
    },
    ref,
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: "bg-primary-500",
      success: "bg-success-500",
      warning: "bg-warning-500",
      danger: "bg-danger-500",
    };

    const sizes = {
      sm: "h-2",
      default: "h-3",
      lg: "h-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-gray-200",
          sizes[size],
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            variants[variant],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

// Tabs Components
interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, onValueChange, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props} />
  ),
);
Tabs.displayName = "Tabs";

const TabsList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-xl bg-gray-100/80 p-1.5 text-gray-600 shadow-inner backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  active?: boolean;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, active, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:text-gray-900 hover:bg-white/50",
        className,
      )}
      {...props}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  active?: boolean;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, active, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "animate-fade-in" : "hidden",
        className,
      )}
      {...props}
    />
  ),
);
TabsContent.displayName = "TabsContent";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  variant?: "default" | "gradient" | "glass";
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    { title, value, icon, trend, trendValue, className, variant = "default" },
    ref,
  ) => {
    const trendColors = {
      up: "text-success-600 bg-success-50",
      down: "text-danger-600 bg-danger-50",
      neutral: "text-gray-600 bg-gray-50",
    };

    const cardVariants = {
      default: "bg-white border-gray-200/60",
      gradient:
        "bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-blue-200/30",
      glass: "glass border-white/20",
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "p-6 hover:shadow-medium transition-all duration-300",
          cardVariants[variant],
          className,
        )}
        hover="lift"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {value}
            </p>
            {trend && trendValue && (
              <div
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  trendColors[trend],
                )}
              >
                {trendValue}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 text-primary-500 opacity-80">
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
  },
);
StatCard.displayName = "StatCard";

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  className?: string;
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ label, value, subtitle, color = "blue", className }, ref) => {
    const colorVariants = {
      blue: "bg-gradient-to-br from-blue-500 to-blue-600",
      green: "bg-gradient-to-br from-success-500 to-success-600",
      purple: "bg-gradient-to-br from-accent-500 to-accent-600",
      orange: "bg-gradient-to-br from-warning-500 to-warning-600",
      red: "bg-gradient-to-br from-danger-500 to-danger-600",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
          colorVariants[color],
          className,
        )}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
        </div>
      </div>
    );
  },
);
MetricCard.displayName = "MetricCard";

// Loading Spinner Component
interface LoaderProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

const Loader = forwardRef<HTMLDivElement, LoaderProps>(
  ({ size = "default", className }, ref) => {
    const sizes = {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-primary-500",
          sizes[size],
          className,
        )}
      />
    );
  },
);
Loader.displayName = "Loader";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  StatCard,
  MetricCard,
  Loader,
};
