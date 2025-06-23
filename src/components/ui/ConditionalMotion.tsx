import React from "react";
import { motion } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";

interface ConditionalMotionProps {
  /** Animation props to apply on first visit */
  firstVisitAnimation?: {
    initial?: any;
    animate?: any;
    transition?: any;
    exit?: any;
  };
  /** Route to track for first visit (defaults to current route) */
  route?: string;
  /** Whether to disable localStorage persistence */
  disablePersistence?: boolean;
  /** Children to render */
  children: React.ReactNode;
  /** HTML element or motion component to render (defaults to motion.div) */
  as?: keyof typeof motion | React.ComponentType<any>;
  /** Standard HTML attributes */
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  /** Common motion props */
  layout?: boolean | "size" | "position" | "preserve-aspect";
  layoutId?: string;
  drag?: boolean | "x" | "y";
  whileHover?: any;
  whileTap?: any;
  whileFocus?: any;
  whileDrag?: any;
  whileInView?: any;
}

/**
 * Wrapper component that conditionally applies animations only on first visit to a route
 *
 * @example
 * ```tsx
 * <ConditionalMotion
 *   firstVisitAnimation={{
 *     initial: { opacity: 0, y: 20 },
 *     animate: { opacity: 1, y: 0 },
 *     transition: { duration: 0.5 }
 *   }}
 *   className="my-component"
 * >
 *   <div>This will animate only on first visit</div>
 * </ConditionalMotion>
 * ```
 */
export function ConditionalMotion({
  firstVisitAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
  route,
  disablePersistence = false,
  children,
  as = "div",
  ...motionProps
}: ConditionalMotionProps) {
  const { isFirstVisit } = useFirstVisit({
    route,
    disablePersistence,
  });

  const animationProps = getAnimationProps(isFirstVisit, firstVisitAnimation);

  // Get the motion component
  const MotionComponent =
    typeof as === "string" ? motion[as as keyof typeof motion] : as;

  return (
    <MotionComponent {...motionProps} {...animationProps}>
      {children}
    </MotionComponent>
  );
}

/**
 * Pre-configured motion components with common first-visit animations
 */
export const ConditionalMotionPresets = {
  /**
   * Fade in from bottom
   */
  FadeUp: (props: Omit<ConditionalMotionProps, "firstVisitAnimation">) => (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      }}
      {...props}
    />
  ),

  /**
   * Scale in with fade
   */
  ScaleIn: (props: Omit<ConditionalMotionProps, "firstVisitAnimation">) => (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.3 },
      }}
      {...props}
    />
  ),

  /**
   * Slide in from left
   */
  SlideInLeft: (props: Omit<ConditionalMotionProps, "firstVisitAnimation">) => (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.4 },
      }}
      {...props}
    />
  ),

  /**
   * Slide in from right
   */
  SlideInRight: (
    props: Omit<ConditionalMotionProps, "firstVisitAnimation">,
  ) => (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.4 },
      }}
      {...props}
    />
  ),

  /**
   * Stagger children animations (useful for lists)
   */
  StaggerChildren: (
    props: Omit<ConditionalMotionProps, "firstVisitAnimation"> & {
      staggerDelay?: number;
    },
  ) => {
    const { staggerDelay = 0.1, ...restProps } = props;
    return (
      <ConditionalMotion
        firstVisitAnimation={{
          animate: {
            transition: {
              staggerChildren: staggerDelay,
            },
          },
        }}
        {...restProps}
      />
    );
  },

  /**
   * Child item for stagger animations
   */
  StaggerChild: (
    props: Omit<ConditionalMotionProps, "firstVisitAnimation">,
  ) => (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }}
      {...props}
    />
  ),
};

/**
 * Hook to create a conditional motion component with custom animations
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ConditionalCard = useConditionalMotion({
 *     initial: { opacity: 0, rotateY: -90 },
 *     animate: { opacity: 1, rotateY: 0 },
 *     transition: { duration: 0.6 }
 *   });
 *
 *   return (
 *     <ConditionalCard className="card">
 *       Card content
 *     </ConditionalCard>
 *   );
 * }
 * ```
 */
export function useConditionalMotion(
  firstVisitAnimation: ConditionalMotionProps["firstVisitAnimation"],
  options?: { route?: string; disablePersistence?: boolean },
) {
  return function ConditionalMotionComponent(
    props: Omit<
      ConditionalMotionProps,
      "firstVisitAnimation" | "route" | "disablePersistence"
    >,
  ) {
    return (
      <ConditionalMotion
        firstVisitAnimation={firstVisitAnimation}
        route={options?.route}
        disablePersistence={options?.disablePersistence}
        {...props}
      />
    );
  };
}
