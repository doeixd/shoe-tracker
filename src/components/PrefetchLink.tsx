import React from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "~/lib/utils";

interface PrefetchLinkProps extends LinkProps {
  className?: string;
  children?: React.ReactNode;
  // Control TanStack Router's built-in prefetching
  preload?: "intent" | "render" | false;
  preloadDelay?: number;
}

/**
 * Simplified Link component that leverages TanStack Router's built-in prefetching
 *
 * TanStack Router automatically handles:
 * - Prefetching on hover/focus (when preload="intent")
 * - Authentication-aware prefetching
 * - Optimal timing and caching
 * - Memory management
 */
export function PrefetchLink({
  className,
  children,
  preload = "intent", // Use TanStack Router's built-in intent prefetching
  preloadDelay = 50,
  ...linkProps
}: PrefetchLinkProps) {
  return (
    <Link
      preload={preload}
      preloadDelay={preloadDelay}
      className={cn("transition-colors duration-200", className)}
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
export function NavPrefetchLink(props: Omit<PrefetchLinkProps, "preload">) {
  return (
    <PrefetchLink
      preload="render" // Prefetch immediately when component renders
      preloadDelay={0}
      {...props}
    />
  );
}

// Card link with hover prefetching for lists and grids
export function CardPrefetchLink(props: Omit<PrefetchLinkProps, "preload">) {
  return (
    <PrefetchLink
      preload="intent" // Prefetch on hover/focus
      preloadDelay={50}
      {...props}
    />
  );
}

// Link without prefetching for cases where it's not needed
export function SimplePrefetchLink(props: Omit<PrefetchLinkProps, "preload">) {
  return (
    <PrefetchLink
      preload={false} // Disable prefetching
      {...props}
    />
  );
}

// Smart link that uses TanStack Router's built-in logic
export function SmartPrefetchLink(props: PrefetchLinkProps) {
  return (
    <PrefetchLink
      preload="intent" // Let TanStack Router handle the smart prefetching
      preloadDelay={50}
      {...props}
    />
  );
}
