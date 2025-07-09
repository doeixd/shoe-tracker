import React, { useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "~/components/AuthProvider";
import { Loader2, Lock, AlertTriangle } from "lucide-react";

interface AuthWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function AuthWrapper({
  children,
  fallback,
  redirectTo = "/auth/signin",
  requireAuth = true
}: AuthWrapperProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      // If authentication is required but user is not authenticated,
      // redirect to sign-in page with return URL
      const currentPath = window.location.pathname + window.location.search;
      navigate({
        to: redirectTo,
        search: { redirect: currentPath },
      });
    }
  }, [isAuthenticated, isLoading, requireAuth, navigate, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || <DefaultLoadingFallback />;
  }

  // If auth is required but user is not authenticated, show sign-in required
  if (requireAuth && !isAuthenticated) {
    return fallback || <SignInRequiredFallback redirectTo={redirectTo} />;
  }

  // If auth is not required or user is authenticated, render children
  return <>{children}</>;
}

function DefaultLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function SignInRequiredFallback({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    const currentPath = window.location.pathname + window.location.search;
    navigate({
      to: redirectTo,
      search: { redirect: currentPath },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access your dashboard and track your running shoes.
          </p>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for wrapping components with authentication
export function withAuthWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthWrapperProps, 'children'> = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthWrapper {...options}>
        <Component {...props} />
      </AuthWrapper>
    );
  };
}

// Hook for checking authentication status with error handling
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user,
    isReady: !isLoading,
    shouldRedirect: !isLoading && !isAuthenticated,
  };
}

// Component for handling authentication errors
export function AuthErrorHandler({
  error,
  onRetry,
  onSignIn
}: {
  error: Error;
  onRetry?: () => void;
  onSignIn?: () => void;
}) {
  const navigate = useNavigate();

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      navigate({ to: "/auth/signin" });
    }
  };

  const isAuthError = error.message?.includes("authenticated") ||
                     error.message?.includes("unauthorized") ||
                     error.message?.includes("access denied");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isAuthError ? "Authentication Error" : "Something went wrong"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isAuthError
              ? "Your session has expired. Please sign in again to continue."
              : "An error occurred while loading the page. Please try again."}
          </p>

          <div className="space-y-3">
            {isAuthError ? (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                Sign In Again
              </button>
            ) : (
              onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
