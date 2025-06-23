import React, { useRef, useEffect } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { useAuth } from "~/components/AuthProvider";
import { usePrefetching } from "~/hooks/usePrefetching";
import { cn } from "~/lib/utils";

interface PrefetchLinkProps extends LinkProps {
  prefetchMode?: "hover" | "viewport" | "immediate" | "none";
  prefetchPriority?: "high" | "medium" | "low";
  prefetchDelay?: number;
  className?: string;
  children?: React.ReactNode;
  // Disable prefetching for external links or when not needed
  disablePrefetch?: boolean;
  // Custom prefetch options
  prefetchOptions?: {
    background?: boolean;
    requireAuth?: boolean;
  };
}

/**
 * Enhanced Link component with intelligent auth-aware prefetching
 *
 * Features:
 * - Hover-based prefetching (default)
 * - Viewport-based prefetching using Intersection Observer
 * - Immediate prefetching for critical routes
 * - Auth-aware - only prefetches when user is authenticated
 * - Configurable priority and delay
 * - Graceful fallback to regular Link when prefetching is disabled
 */
export function PrefetchLink({
  prefetchMode = "hover",
  prefetchPriority = "medium",
  prefetchDelay = 0,
  className,
  children,
  disablePrefetch = false,
  prefetchOptions = {},
  to,
  ...linkProps
}: PrefetchLinkProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const {
    canPrefetch,
    prefetchRoute,
    attachPrefetch,
    observeElement,
    unobserveElement,
  } = usePrefetching();

  const linkRef = useRef<HTMLAnchorElement>(null);
  const hasAttachedPrefetch = useRef(false);
  const isObserving = useRef(false);

  // Determine if we should enable prefetching
  const shouldPrefetch = !disablePrefetch &&
                        !isLoading &&
                        isAuthenticated &&
                        canPrefetch &&
                        prefetchMode !== "none";

  // Convert route to string for prefetching
  const routePath = typeof to === "string" ? to : to.toString();

  // Set up prefetching based on mode
  useEffect(() => {
    if (!shouldPrefetch || !linkRef.current) return;

    const element = linkRef.current;

    switch (prefetchMode) {
      case "immediate":
        // Prefetch immediately when component mounts
        if (!hasAttachedPrefetch.current) {
          hasAttachedPrefetch.current = true;
          prefetchRoute(routePath, {
            background: true,
            delay: prefetchDelay,
            priority: prefetchPriority,
            requireAuth: true,
            ...prefetchOptions,
          });
        }
        break;

      case "hover":
        // Prefetch on hover/focus/touch
        if (!hasAttachedPrefetch.current) {
          hasAttachedPrefetch.current = true;
          const cleanup = attachPrefetch(element, routePath, {
            background: true,
            delay: prefetchDelay,
            priority: prefetchPriority,
            requireAuth: true,
            ...prefetchOptions,
          });

          // Store cleanup function for unmount
          return cleanup;
        }
        break;

      case "viewport":
        // Prefetch when element comes into viewport
        if (!isObserving.current) {
          isObserving.current = true;
          observeElement(element, routePath, {
            background: true,
            delay: prefetchDelay,
            priority: prefetchPriority,
            requireAuth: true,
            ...prefetchOptions,
          });

          // Cleanup on unmount
          return () => {
            unobserveElement(element);
            isObserving.current = false;
          };
        }
        break;
    }
  }, [
    shouldPrefetch,
    prefetchMode,
    routePath,
    prefetchDelay,
    prefetchPriority,
    prefetchRoute,
    attachPrefetch,
    observeElement,
    unobserveElement,
    prefetchOptions,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasAttachedPrefetch.current = false;
      if (isObserving.current && linkRef.current) {
        unobserveElement(linkRef.current);
        isObserving.current = false;
      }
    };
  }, [unobserveElement]);

  return (
    <Link
      ref={linkRef}
      to={to}
      className={cn(
        // Add subtle visual feedback for prefetch-enabled links
        shouldPrefetch && "transition-colors duration-200",
        className
      )}
      {...linkProps}
    >
      {children}
    </Link>
  );
}

/**
 * Specialized components for common use cases
 */

// Navigation link with immediate prefetching for main menu items
export function NavPrefetchLink(props: Omit<PrefetchLinkProps, "prefetchMode">) {
  return (
    <PrefetchLink
      prefetchMode="immediate"
      prefetchPriority="high"
      prefetchDelay={100}
      {...props}
    />
  );
}

// Card link with hover prefetching for lists and grids
export function CardPrefetchLink(props: Omit<PrefetchLinkProps, "prefetchMode">) {
  return (
    <PrefetchLink
      prefetchMode="hover"
      prefetchPriority="medium"
      prefetchDelay={50}
      {...props}
    />
  );
}

// Viewport link for large lists where hover isn't ideal
export function ViewportPrefetchLink(props: Omit<PrefetchLinkProps, "prefetchMode">) {
  return (
    <PrefetchLink
      prefetchMode="viewport"
      prefetchPriority="low"
      prefetchDelay={300}
      {...props}
    />
  );
}

// Smart link that chooses prefetch mode based on screen size
export function SmartPrefetchLink(props: PrefetchLinkProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use viewport prefetching on mobile, hover on desktop
  const prefetchMode = isMobile ? "viewport" : "hover";

  return (
    <PrefetchLink
      prefetchMode={prefetchMode}
      prefetchPriority="medium"
      {...props}
    />
  );
}

/**
 * Hook for programmatic prefetching
 */
export function useLinkPrefetch() {
  const { canPrefetch, prefetchRoute } = usePrefetching();

  const prefetchLink = React.useCallback((
    route: string,
    options: {
      priority?: "high" | "medium" | "low";
      delay?: number;
      background?: boolean;
    } = {}
  ) => {
    if (!canPrefetch) return;

    prefetchRoute(route, {
      background: true,
      requireAuth: true,
      ...options,
    });
  }, [canPrefetch, prefetchRoute]);

  return { prefetchLink, canPrefetch };
}

/**
 * Higher-order component for adding prefetching to existing Link components
 */
export function withPrefetch<T extends { to: any }>(
  Component: React.ComponentType<T>,
  defaultOptions: Partial<PrefetchLinkProps> = {}
) {
  return function PrefetchWrappedComponent(props: T & Partial<PrefetchLinkProps>) {
    const { prefetchRoute } = usePrefetching();
    const { isAuthenticated } = useAuth();
    const ref = useRef<HTMLElement>(null);

    const {
      prefetchMode = "hover",
      prefetchPriority = "medium",
      prefetchDelay = 0,
      disablePrefetch = false,
      prefetchOptions = {},
      ...componentProps
    } = { ...defaultOptions, ...props };

    const shouldPrefetch = !disablePrefetch && isAuthenticated;
    const routePath = typeof props.to === "string" ? props.to : props.to.toString();

    useEffect(() => {
      if (!shouldPrefetch || !ref.current || prefetchMode !== "hover") return;

      const element = ref.current;
      const prefetchHandler = () => {
        prefetchRoute(routePath, {
          background: true,
          delay: prefetchDelay,
          priority: prefetchPriority,
          requireAuth: true,
          ...prefetchOptions,
        });
      };

      element.addEventListener("mouseenter", prefetchHandler, { passive: true });
      element.addEventListener("focusin", prefetchHandler, { passive: true });

      return () => {
        element.removeEventListener("mouseenter", prefetchHandler);
        element.removeEventListener("focusin", prefetchHandler);
      };
    }, [shouldPrefetch, routePath, prefetchMode, prefetchDelay, prefetchPriority, prefetchRoute, prefetchOptions]);

    return <Component ref={ref} {...(componentProps as T)} />;
  };
}
