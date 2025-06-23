import React from "react";
import { useAuth } from "./AuthProvider";
import { Button } from "./FormComponents";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface AuthErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function AuthErrorFallback({
  error,
  resetErrorBoundary,
}: AuthErrorFallbackProps) {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const isAuthError =
    error.message?.includes("not authenticated") ||
    error.message?.includes("Unauthorized") ||
    error.message?.includes("access denied");

  const isCollectionNotFound = error.message?.includes("Collection not found");

  const handleRetry = () => {
    toast.dismiss();
    resetErrorBoundary();
  };

  const handleGoHome = () => {
    navigate({ to: "/" });
    resetErrorBoundary();
  };

  const handleGoToCollections = () => {
    navigate({ to: "/collections", search: { modal: false } });
    resetErrorBoundary();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      resetErrorBoundary();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isCollectionNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Collection Not Found
              </h2>
              <p className="text-gray-600">
                The collection you're looking for doesn't exist or has been
                removed.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                You may need to create your collections first or check if you
                have access to this collection.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleGoToCollections}
                icon={<Home className="w-4 h-4" />}
                className="flex-1 sm:flex-none"
              >
                View Collections
              </Button>
              <Button
                onClick={handleGoHome}
                variant="secondary"
                icon={<Home className="w-4 h-4" />}
                className="flex-1 sm:flex-none"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Authentication Required
              </h2>
              <p className="text-gray-600">
                {isAuthenticated
                  ? "Your session has expired or you don't have access to this resource."
                  : "Please sign in to access this page."}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error.message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={handleSignOut}
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                  >
                    Sign Out & Retry
                  </Button>
                  <Button
                    onClick={handleGoHome}
                    icon={<Home className="w-4 h-4" />}
                    className="flex-1 sm:flex-none"
                  >
                    Go Home
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGoHome}
                  icon={<Home className="w-4 h-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Go to Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General error fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Something went wrong
            </h2>
            <p className="text-gray-600">
              We encountered an unexpected error. This might be temporary.
            </p>
          </div>

          <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
            <summary className="font-medium text-gray-700 cursor-pointer text-center">
              Error Details
            </summary>
            <div className="mt-3 text-sm text-gray-600">
              <p>
                <strong>Message:</strong> {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              icon={<RefreshCw className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              variant="secondary"
              icon={<Home className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<AuthErrorFallbackProps>;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);

    if (
      !error.message?.includes("not authenticated") &&
      !error.message?.includes("Unauthorized") &&
      !error.message?.includes("access denied")
    ) {
      console.error("Non-auth error in boundary:", error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || AuthErrorFallback;
      return (
        <Fallback
          error={this.state.error}
          resetErrorBoundary={() => {
            this.setState({ hasError: false, error: null });
            toast.dismiss();
          }}
        />
      );
    }

    return this.props.children;
  }
}

export function AuthErrorBoundary(props: AuthErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

// Higher-order component for wrapping route components
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function AuthErrorBoundaryWrapper(props: P) {
    return (
      <AuthErrorBoundary>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}

// Hook for manually triggering error boundary reset
export function useAuthErrorBoundary() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAuthError = React.useCallback(
    (error: Error) => {
      const isAuthError =
        error.message?.includes("not authenticated") ||
        error.message?.includes("Unauthorized") ||
        error.message?.includes("access denied");

      if (isAuthError && !isAuthenticated) {
        // Redirect to sign in if not authenticated
        navigate({ to: "/auth/signin" });
      } else {
        // Re-throw the error to be caught by error boundary
        throw error;
      }
    },
    [isAuthenticated, navigate],
  );

  return { handleAuthError };
}
