import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

export interface AuthUser {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

/**
 * Check authentication status in route loaders
 * Throws redirect to login if not authenticated
 */
export async function requireAuth(queryClient: QueryClient): Promise<AuthUser> {
  try {
    // Check if user is authenticated by querying user profile
    const user = await queryClient.ensureQueryData(
      convexQuery(api.auth.getUserProfile, {}),
    );

    if (!user) {
      throw redirect({
        to: "/auth/signin",
        search: {
          redirect:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "/",
        },
      });
    }

    return user;
  } catch (error: any) {
    // If error contains "not authenticated" or is an auth error, redirect to login
    if (
      error?.message?.includes("not authenticated") ||
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("access denied")
    ) {
      throw redirect({
        to: "/auth/signin",
        search: {
          redirect:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "/",
        },
      });
    }

    // Re-throw other errors (network issues, etc.)
    throw error;
  }
}

/**
 * Check authentication status without redirecting
 * Useful for optional auth checks
 */
export async function checkAuth(
  queryClient: QueryClient,
): Promise<AuthCheckResult> {
  try {
    const user = await queryClient.ensureQueryData(
      convexQuery(api.auth.getUserProfile, {}),
    );

    return {
      isAuthenticated: !!user,
      user: user || null,
    };
  } catch (error: any) {
    // If authentication error, return not authenticated
    if (
      error?.message?.includes("not authenticated") ||
      error?.message?.includes("Unauthorized") ||
      error?.message?.includes("access denied")
    ) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    // For other errors, assume not authenticated to be safe
    console.warn("Auth check failed:", error);
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}

/**
 * Redirect to intended page after login
 */
export function getRedirectUrl(searchParams: URLSearchParams): string {
  const redirect = searchParams.get("redirect");

  // Validate redirect URL to prevent open redirects
  if (redirect && isValidRedirect(redirect)) {
    return redirect;
  }

  // Default redirect to dashboard
  return "/";
}

/**
 * Validate redirect URL to prevent open redirects
 */
function isValidRedirect(url: string): boolean {
  try {
    // Must be relative URL or same origin
    if (url.startsWith("/")) {
      return true;
    }

    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Higher-order function to wrap route loaders with auth requirements
 */
export function withAuthLoader<T extends Record<string, any>>(
  loader: (context: { queryClient: QueryClient; user: AuthUser }) => Promise<T>,
) {
  return async ({ context }: { context: { queryClient: QueryClient } }) => {
    const user = await requireAuth(context.queryClient);
    return loader({ ...context, user });
  };
}

/**
 * Higher-order function to wrap route loaders with optional auth
 */
export function withOptionalAuthLoader<T extends Record<string, any>>(
  loader: (context: {
    queryClient: QueryClient;
    auth: AuthCheckResult;
  }) => Promise<T>,
) {
  return async ({ context }: { context: { queryClient: QueryClient } }) => {
    const auth = await checkAuth(context.queryClient);
    return loader({ ...context, auth });
  };
}
