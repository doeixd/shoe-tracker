import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "./ui";

interface ResponsiveLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  center?: boolean;
  fullHeight?: boolean;
  safeArea?: boolean;
}

const ResponsiveLayout = forwardRef<HTMLDivElement, ResponsiveLayoutProps>(
  (
    {
      children,
      maxWidth = "full",
      padding = "md",
      center = false,
      fullHeight = false,
      safeArea = false,
      className,
      ...props
    },
    ref,
  ) => {
    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      "2xl": "max-w-7xl",
      full: "max-w-none",
    };

    const paddingClasses = {
      none: "",
      sm: "p-2 sm:p-4",
      md: "p-4 sm:p-6 lg:p-8",
      lg: "p-6 sm:p-8 lg:p-12",
      xl: "p-8 sm:p-12 lg:p-16",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          center ? "mx-auto" : "",
          fullHeight ? "min-h-screen" : "",
          safeArea ? "safe-area-p safe-area-pb" : "",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ResponsiveLayout.displayName = "ResponsiveLayout";

interface GridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  autoRows?: boolean;
}

const GridLayout = forwardRef<HTMLDivElement, GridLayoutProps>(
  (
    {
      children,
      columns = { default: 1 },
      gap = "md",
      autoRows = false,
      className,
      ...props
    },
    ref,
  ) => {
    const gapClasses = {
      none: "gap-0",
      sm: "gap-2 sm:gap-3",
      md: "gap-4 sm:gap-6",
      lg: "gap-6 sm:gap-8",
      xl: "gap-8 sm:gap-10",
    };

    const getColumnClasses = () => {
      const classes = [`grid-cols-${columns.default}`];

      if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
      if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
      if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
      if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);

      return classes.join(" ");
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          getColumnClasses(),
          gapClasses[gap],
          autoRows ? "auto-rows-fr" : "",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GridLayout.displayName = "GridLayout";

interface FlexLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  direction?: "row" | "col" | "row-reverse" | "col-reverse";
  wrap?: boolean;
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "baseline" | "stretch";
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  responsive?: {
    sm?: Partial<Pick<FlexLayoutProps, "direction" | "justify" | "align">>;
    md?: Partial<Pick<FlexLayoutProps, "direction" | "justify" | "align">>;
    lg?: Partial<Pick<FlexLayoutProps, "direction" | "justify" | "align">>;
  };
}

const FlexLayout = forwardRef<HTMLDivElement, FlexLayoutProps>(
  (
    {
      children,
      direction = "row",
      wrap = false,
      justify = "start",
      align = "start",
      gap = "md",
      responsive,
      className,
      ...props
    },
    ref,
  ) => {
    const directionClasses = {
      row: "flex-row",
      col: "flex-col",
      "row-reverse": "flex-row-reverse",
      "col-reverse": "flex-col-reverse",
    };

    const justifyClasses = {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    };

    const alignClasses = {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch",
    };

    const gapClasses = {
      none: "gap-0",
      sm: "gap-2 sm:gap-3",
      md: "gap-4 sm:gap-6",
      lg: "gap-6 sm:gap-8",
      xl: "gap-8 sm:gap-10",
    };

    const getResponsiveClasses = () => {
      const classes: string[] = [];

      if (responsive?.sm) {
        if (responsive.sm.direction) {
          classes.push(`sm:${directionClasses[responsive.sm.direction]}`);
        }
        if (responsive.sm.justify) {
          classes.push(`sm:${justifyClasses[responsive.sm.justify]}`);
        }
        if (responsive.sm.align) {
          classes.push(`sm:${alignClasses[responsive.sm.align]}`);
        }
      }

      if (responsive?.md) {
        if (responsive.md.direction) {
          classes.push(`md:${directionClasses[responsive.md.direction]}`);
        }
        if (responsive.md.justify) {
          classes.push(`md:${justifyClasses[responsive.md.justify]}`);
        }
        if (responsive.md.align) {
          classes.push(`md:${alignClasses[responsive.md.align]}`);
        }
      }

      if (responsive?.lg) {
        if (responsive.lg.direction) {
          classes.push(`lg:${directionClasses[responsive.lg.direction]}`);
        }
        if (responsive.lg.justify) {
          classes.push(`lg:${justifyClasses[responsive.lg.justify]}`);
        }
        if (responsive.lg.align) {
          classes.push(`lg:${alignClasses[responsive.lg.align]}`);
        }
      }

      return classes.join(" ");
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          directionClasses[direction],
          justifyClasses[justify],
          alignClasses[align],
          gapClasses[gap],
          wrap ? "flex-wrap" : "",
          getResponsiveClasses(),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

FlexLayout.displayName = "FlexLayout";

interface StackLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  space?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  divider?: ReactNode;
}

const StackLayout = forwardRef<HTMLDivElement, StackLayoutProps>(
  (
    { children, space = "md", align = "stretch", divider, className, ...props },
    ref,
  ) => {
    const spaceClasses = {
      none: "space-y-0",
      xs: "space-y-1",
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
      xl: "space-y-8",
    };

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    };

    const childrenArray = Array.isArray(children) ? children : [children];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          !divider ? spaceClasses[space] : "",
          alignClasses[align],
          className,
        )}
        {...props}
      >
        {divider
          ? childrenArray.map((child, index) => (
              <div key={index}>
                {child}
                {index < childrenArray.length - 1 && divider}
              </div>
            ))
          : children}
      </div>
    );
  },
);

StackLayout.displayName = "StackLayout";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  centered?: boolean;
  fluid?: boolean;
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      size = "xl",
      centered = true,
      fluid = false,
      className,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-2xl",
      lg: "max-w-4xl",
      xl: "max-w-6xl",
      "2xl": "max-w-7xl",
      full: "max-w-none",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full",
          !fluid ? sizeClasses[size] : "",
          centered ? "mx-auto" : "",
          "px-4 sm:px-6 lg:px-8",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Container.displayName = "Container";

export { ResponsiveLayout, GridLayout, FlexLayout, StackLayout, Container };
