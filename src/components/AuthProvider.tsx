import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Lock, Loader2, AlertCircle } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userSetupComplete, setUserSetupComplete] = useState(false);

  // Get current user from Convex
  const userQuery = useQuery({
    ...convexQuery(api.auth.getUserProfile, {}),
    retry: (failureCount, error) => {
      // Only retry on network errors, not auth errors
      if (
        error?.message?.includes("not authenticated") ||
        error?.message?.includes("Unauthorized")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false, // Don't auto-refetch
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  const user = userQuery.data;
  const isAuthenticated = !!user;

  // Setup user data mutation
  const setupUserDataMutation = useConvexMutation(api.auth.setupUserData);

  // Setup user data on first authentication
  useEffect(() => {
    if (isAuthenticated && !userSetupComplete && !authError) {
      const handleSetup = async () => {
        try {
          const result = await setupUserDataMutation({});
          setUserSetupComplete(true);
          if (result.assigned) {
            toast.success(
              `Welcome! Set up ${result.collectionsCount} collections and ${result.shoesCount} shoes to get you started.`,
            );
          }
        } catch (error) {
          console.error("User setup error:", error);
          // Don't show error toast for setup - just log it
          setUserSetupComplete(true); // Mark as complete to avoid retry loop
        }
      };

      handleSetup();
    }
  }, [isAuthenticated, userSetupComplete, authError, setupUserDataMutation]);

  // Update prefetcher with auth state changes
  // Auth state is now handled internally by TanStack Router
  // No need for external prefetch state management

  useEffect(() => {
    // Set loading to false once we've determined auth state
    if (!userQuery.isLoading) {
      setIsLoading(false);

      // Handle auth errors
      if (userQuery.error) {
        const errorMessage = userQuery.error?.message || "Authentication error";
        if (!errorMessage.includes("not authenticated")) {
          setAuthError(errorMessage);
          toast.error("Authentication error. Please try signing in again.");
        }
      } else {
        setAuthError(null);
      }
    }
  }, [userQuery.isLoading, userQuery.error]);

  const signIn = async (provider: "google") => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await convexSignIn(provider);
      setUserSetupComplete(false); // Reset setup state for new sign in
      // Success will be handled by the auth state change
    } catch (error: any) {
      console.error("Sign in error:", error);

      let errorMessage = "Failed to sign in. Please try again.";

      if (error?.message) {
        if (error.message.includes("popup_closed_by_user")) {
          errorMessage = "Sign in was cancelled.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("redirect_uri_mismatch")) {
          errorMessage = "Configuration error. Please contact support.";
        }
      }

      setAuthError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);

      // Auth state handled by TanStack Router automatically
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await convexSignOut();
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);

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
