import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Lock, Loader2, AlertCircle } from "lucide-react";

// Auth debugging utilities
const DEBUG_PREFIX = "[AUTH]";
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Force production logging for debugging
const FORCE_PRODUCTION_LOGGING = true;

interface AuthDebugEvent {
  timestamp: number;
  event: string;
  data?: any;
  level: "debug" | "info" | "warn" | "error";
}

interface AuthMetrics {
  signInAttempts: number;
  signInSuccesses: number;
  signInFailures: number;
  signOutAttempts: number;
  signOutSuccesses: number;
  signOutFailures: number;
  queryErrors: number;
  lastActivity: number;
}

// Global auth debug state
let authDebugEvents: AuthDebugEvent[] = [];
let authMetrics: AuthMetrics = {
  signInAttempts: 0,
  signInSuccesses: 0,
  signInFailures: 0,
  signOutAttempts: 0,
  signOutSuccesses: 0,
  signOutFailures: 0,
  queryErrors: 0,
  lastActivity: Date.now(),
};

// Debug logging function
function authLog(
  level: "debug" | "info" | "warn" | "error",
  event: string,
  data?: any,
) {
  const timestamp = Date.now();
  const debugEvent: AuthDebugEvent = { timestamp, event, data, level };

  // Store debug events (keep last 100)
  authDebugEvents.push(debugEvent);
  if (authDebugEvents.length > 100) {
    authDebugEvents = authDebugEvents.slice(-100);
  }

  // Console logging with appropriate level
  const logData = data ? ` - ${JSON.stringify(data)}` : "";
  const logMessage = `${DEBUG_PREFIX} ${event}${logData}`;

  if (isDevelopment) {
    // Verbose logging in development
    switch (level) {
      case "debug":
        console.debug(logMessage);
        break;
      case "info":
        console.info(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "error":
        console.error(logMessage);
        break;
    }
  } else if (
    isProduction &&
    (FORCE_PRODUCTION_LOGGING || level === "warn" || level === "error")
  ) {
    // Enhanced production logging for debugging
    const sanitizedData = data
      ? {
          error: data?.message || data?.error || "Unknown error",
          type: data?.name || data?.type || "Unknown",
          code: data?.code,
          status: data?.status,
          stack:
            level === "error" && data?.stack
              ? data.stack.slice(0, 200) + "..."
              : undefined,
        }
      : undefined;

    const prodMessage = `${DEBUG_PREFIX} [${level.toUpperCase()}] ${event}${sanitizedData ? ` - ${JSON.stringify(sanitizedData)}` : ""}`;

    // Always log to console in production when debugging
    switch (level) {
      case "debug":
        console.log(prodMessage);
        break;
      case "info":
        console.info(prodMessage);
        break;
      case "warn":
        console.warn(prodMessage);
        break;
      case "error":
        console.error(prodMessage);
        break;
    }

    // Also log to localStorage for debugging
    try {
      const existingLogs = JSON.parse(
        localStorage.getItem("auth-debug-logs") || "[]",
      );
      existingLogs.push({
        timestamp: Date.now(),
        level,
        event,
        data: sanitizedData,
        url: window.location.href,
      });
      // Keep only last 50 logs
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      localStorage.setItem("auth-debug-logs", JSON.stringify(existingLogs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Update metrics
  authMetrics.lastActivity = timestamp;
  if (event.includes("query_error")) {
    authMetrics.queryErrors++;
  }
}

// Export debug utilities for external access
export const authDebug = {
  getEvents: () => [...authDebugEvents],
  getMetrics: () => ({ ...authMetrics }),
  clearEvents: () => {
    authDebugEvents = [];
  },
  resetMetrics: () => {
    authMetrics = {
      signInAttempts: 0,
      signInSuccesses: 0,
      signInFailures: 0,
      signOutAttempts: 0,
      signOutSuccesses: 0,
      signOutFailures: 0,
      queryErrors: 0,
      lastActivity: Date.now(),
    };
  },
};

// Simple auth state type for internal use
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
}

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (provider: "google") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userSetupComplete, setUserSetupComplete] = useState(false);
  const authProfileQuery = convexQuery(api.auth.getUserProfile, {});

  // Debug initialization
  useEffect(() => {
    authLog("info", "AuthProvider_initialized", {
      environment: isProduction ? "production" : "development",
      convexUrl: import.meta.env.VITE_CONVEX_URL ? "configured" : "missing",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      forceLogging: FORCE_PRODUCTION_LOGGING,
    });

    // Log initial browser state
    authLog("debug", "browser_state", {
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      onLine: navigator.onLine,
      localStorage: typeof Storage !== "undefined",
    });

    return () => {
      authLog("info", "AuthProvider_unmounted");
    };
  }, []);

  // Get current user from Convex
  const userQuery = useQuery({
    ...authProfileQuery,
    retry: (failureCount, error) => {
      authLog("warn", "user_query_retry_attempt", {
        failureCount,
        errorMessage: error?.message,
        errorType: error?.name,
      });

      // Only retry on network errors, not auth errors
      if (
        error?.message?.includes("not authenticated") ||
        error?.message?.includes("Unauthorized")
      ) {
        authLog("debug", "user_query_not_retrying_auth_error", {
          errorMessage: error.message,
        });
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false, // Don't auto-refetch
    refetchOnReconnect: true, // Refetch when reconnecting
    onError: (error) => {
      authLog("error", "user_query_error", {
        errorMessage: error?.message,
        errorType: error?.name,
        stack: isDevelopment ? error?.stack : undefined,
      });
    },
    onSuccess: (data) => {
      authLog("debug", "user_query_success", {
        hasUser: !!data,
        userId: data?._id ? `${data._id.slice(0, 8)}...` : null,
      });
    },
  });

  const user = userQuery.data;
  const isAuthenticated = !!user;

  // Track auth state changes
  useEffect(() => {
    authLog("info", "auth_state_changed", {
      isAuthenticated,
      isLoading: userQuery.isLoading,
      hasUser: !!user,
      userId: user?._id ? `${user._id.slice(0, 8)}...` : null,
    });
  }, [isAuthenticated, userQuery.isLoading, user?._id]);

  // Setup user data mutation
  const setupUserDataMutation = useConvexMutation(api.auth.setupUserData);

  // Setup user data on first authentication
  useEffect(() => {
    if (isAuthenticated && !userSetupComplete && !authError) {
      authLog("info", "starting_user_setup", {
        userId: user?._id ? `${user._id.slice(0, 8)}...` : null,
      });

      const handleSetup = async () => {
        try {
          const startTime = Date.now();
          const result = await setupUserDataMutation({});
          const duration = Date.now() - startTime;

          authLog("info", "user_setup_completed", {
            duration,
            assigned: result.assigned,
            collectionsCount: result.collectionsCount,
            shoesCount: result.shoesCount,
          });

          setUserSetupComplete(true);
          if (result.assigned) {
            toast.success(
              `Welcome! Set up ${result.collectionsCount} collections and ${result.shoesCount} shoes to get you started.`,
            );
          }
        } catch (error) {
          authLog("error", "user_setup_error", {
            errorMessage: error?.message,
            errorType: error?.name,
          });
          // Don't show error toast for setup - just log it
          setUserSetupComplete(true); // Mark as complete to avoid retry loop
        }
      };

      handleSetup();
    }
  }, [
    isAuthenticated,
    userSetupComplete,
    authError,
    setupUserDataMutation,
    user?._id,
  ]);

  // Update prefetcher with auth state changes
  // Auth state is now handled internally by TanStack Router
  // No need for external prefetch state management

  useEffect(() => {
    // Set loading to false once we've determined auth state
    if (!userQuery.isLoading) {
      const wasLoading = isLoading;
      setIsLoading(false);

      if (wasLoading) {
        authLog("info", "auth_loading_completed", {
          hasError: !!userQuery.error,
          isAuthenticated,
          loadingDuration: "unknown", // Could track this with timestamps if needed
        });
      }

      // Handle auth errors
      if (userQuery.error) {
        const errorMessage = userQuery.error?.message || "Authentication error";
        authLog("warn", "auth_error_detected", {
          errorMessage,
          errorType: userQuery.error?.name,
          isAuthError: errorMessage.includes("not authenticated"),
        });

        if (!errorMessage.includes("not authenticated")) {
          setAuthError(errorMessage);
          toast.error("Authentication error. Please try signing in again.");
        }
      } else {
        if (authError) {
          authLog("info", "auth_error_cleared");
        }
        setAuthError(null);
      }
    }
  }, [
    userQuery.isLoading,
    userQuery.error,
    isLoading,
    isAuthenticated,
    authError,
  ]);

  const signIn = async (provider: "google") => {
    const startTime = Date.now();
    authMetrics.signInAttempts++;

    authLog("info", "sign_in_started", {
      provider,
      timestamp: new Date().toISOString(),
      environment: isProduction ? "production" : "development",
      currentUrl: window.location.href,
      referrer: document.referrer,
    });

    setIsLoading(true);
    setAuthError(null);

    try {
      authLog("debug", "calling_convex_signin", {
        provider,
        convexUrl: import.meta.env.VITE_CONVEX_URL ? "configured" : "missing",
      });

      await convexSignIn(provider);

      const duration = Date.now() - startTime;
      authMetrics.signInSuccesses++;

      authLog("info", "sign_in_success", {
        provider,
        duration,
        environment: isProduction ? "production" : "development",
      });

      setUserSetupComplete(false); // Reset setup state for new sign in

      // Force a refresh of auth-dependent state to avoid stale unauthenticated cache
      try {
        await queryClient.invalidateQueries({
          queryKey: authProfileQuery.queryKey,
          exact: true,
        });
        await userQuery.refetch();
        authLog("info", "sign_in_profile_refetched");
      } catch (refreshError: any) {
        authLog("warn", "sign_in_profile_refresh_failed", {
          errorMessage: refreshError?.message,
          errorType: refreshError?.name,
        });
      }

      // Success will be handled by the auth state change
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authMetrics.signInFailures++;

      // Enhanced error logging for production debugging
      authLog("error", "sign_in_error", {
        provider,
        duration,
        errorMessage: error?.message,
        errorType: error?.name,
        errorCode: error?.code,
        errorDetails: error?.details,
        convexUrl: import.meta.env.VITE_CONVEX_URL ? "configured" : "missing",
        currentUrl: window.location.href,
        userAgent: navigator.userAgent,
        stack: error?.stack,
        environment: isProduction ? "production" : "development",
      });

      let errorMessage = "Failed to sign in. Please try again.";
      let errorCategory = "unknown";

      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("popup_closed_by_user") ||
          msg.includes("user closed")
        ) {
          errorMessage = "Sign in was cancelled.";
          errorCategory = "user_cancelled";
        } else if (msg.includes("network") || msg.includes("fetch")) {
          errorMessage = "Network error. Please check your connection.";
          errorCategory = "network";
        } else if (msg.includes("redirect_uri_mismatch")) {
          errorMessage = "OAuth configuration error. Please contact support.";
          errorCategory = "configuration";
        } else if (msg.includes("invalid_client")) {
          errorMessage =
            "OAuth client configuration error. Please contact support.";
          errorCategory = "oauth_config";
        } else if (msg.includes("access_denied")) {
          errorMessage = "Access was denied. Please try again.";
          errorCategory = "access_denied";
        } else if (msg.includes("unauthorized")) {
          errorMessage = "Authentication failed. Please try again.";
          errorCategory = "unauthorized";
        } else if (msg.includes("timeout")) {
          errorMessage = "Sign in timed out. Please try again.";
          errorCategory = "timeout";
        } else if (msg.includes("cors")) {
          errorMessage = "Cross-origin error. Please contact support.";
          errorCategory = "cors";
        }
      }

      authLog("warn", "sign_in_error_categorized", {
        category: errorCategory,
        userMessage: errorMessage,
        originalError: error?.message,
        environment: isProduction ? "production" : "development",
      });

      setAuthError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);

      // Auth state handled by TanStack Router automatically
    }
  };

  const signOut = async () => {
    const startTime = Date.now();
    authMetrics.signOutAttempts++;

    authLog("info", "sign_out_started", {
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);
    setAuthError(null);

    try {
      await convexSignOut();

      const duration = Date.now() - startTime;
      authMetrics.signOutSuccesses++;

      authLog("info", "sign_out_success", {
        duration,
      });

      toast.success("Signed out successfully");
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authMetrics.signOutFailures++;

      authLog("error", "sign_out_error", {
        duration,
        errorMessage: error?.message,
        errorType: error?.name,
        stack: isDevelopment ? error?.stack : undefined,
      });

      const errorMessage = error?.message || "Failed to sign out";
      setAuthError(errorMessage);
      toast.error(errorMessage);

      // Even if sign out fails, clear local state
      setIsLoading(false);
      setUserSetupComplete(false); // Reset setup state
    } finally {
      // Auth state handled automatically
    }
  };

  const value: AuthContextType = {
    user: user
      ? {
          id: user._id,
          name: user.name || undefined,
          email: user.email || undefined,
          image: user.image || undefined,
        }
      : null,
    isLoading: isLoading || userQuery.isLoading,
    isAuthenticated: isAuthenticated && !authError,
    signIn,
    signOut,
  };

  // Debug context value changes
  useEffect(() => {
    authLog("debug", "auth_context_value_updated", {
      hasUser: !!value.user,
      isLoading: value.isLoading,
      isAuthenticated: value.isAuthenticated,
      hasError: !!authError,
      userId: value.user?.id ? `${value.user.id.slice(0, 8)}...` : null,
      environment: isProduction ? "production" : "development",
      timestamp: new Date().toISOString(),
    });
  }, [value.isLoading, value.isAuthenticated, value.user, authError]);

  // Add window-level debugging for production
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Expose auth debug functions globally for production debugging
      (window as any).authDebug = {
        ...authDebug,
        getCurrentState: () => ({
          user: value.user,
          isLoading: value.isLoading,
          isAuthenticated: value.isAuthenticated,
          hasError: !!authError,
          error: authError,
          metrics: authMetrics,
          environment: isProduction ? "production" : "development",
        }),
        getLogs: () => {
          try {
            return JSON.parse(localStorage.getItem("auth-debug-logs") || "[]");
          } catch {
            return [];
          }
        },
        clearLogs: () => {
          localStorage.removeItem("auth-debug-logs");
        },
        testSignIn: () => signIn("google"),
        testSignOut: () => signOut(),
      };
    }
  }, [value, authError, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Custom hook for handling auth state changes
export function useAuthGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user,
    shouldShowAuth: !isLoading && !isAuthenticated,
    shouldShowApp: !isLoading && isAuthenticated,
    shouldShowLoading: isLoading,
  };
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <SignInRequired />;
    }

    return <Component {...props} />;
  };
}

function SignInRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-sm text-gray-600">
            Please sign in to access your shoe tracking dashboard
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}

function SignInForm() {
  const { signIn, isLoading } = useAuth();
  const [attemptingSignIn, setAttemptingSignIn] = useState(false);

  const handleSignIn = async () => {
    setAttemptingSignIn(true);
    try {
      await signIn("google");
    } catch (error: any) {
      console.error("Sign-in error:", error);
      toast.error(error?.message || "Failed to sign in");
    } finally {
      setAttemptingSignIn(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSignIn}
        disabled={isLoading || attemptingSignIn}
        className="group relative w-full flex justify-center py-4 px-6 border border-gray-300 text-lg font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading || attemptingSignIn ? (
          <span className="flex items-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Continue with Google"
        )}
      </button>

      {(isLoading || attemptingSignIn) && (
        <div className="flex items-center justify-center text-sm text-gray-500">
          <AlertCircle className="w-4 h-4 mr-1" />
          This may take a few moments...
        </div>
      )}
    </div>
  );
}
