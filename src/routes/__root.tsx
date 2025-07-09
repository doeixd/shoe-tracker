/// <reference types="vite/client" />
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import * as React from "react";
import { Toaster } from "sonner";
import type { QueryClient } from "@tanstack/react-query";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { IconLink } from "~/components/IconLink";
import { NotFound } from "~/components/NotFound";
import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";
import { Loader } from "~/components/Loader";
import { useAuth } from "~/components/AuthProvider";
import { OfflineProvider } from "~/hooks/useOffline";
import {
  PWAInstallPrompt,
  OfflineStatusIndicator,
  UpdateAvailableBanner,
  PWAStatusBar,
} from "~/components/PWAComponents";
import PWAHead from "~/components/PWAHead";
import {
  IOSStatusBar,
  IOSInstallBanner,
  AppUpdateBanner,
} from "~/components/PWAUtils";
import ServiceWorkerIntegration from "~/components/ServiceWorkerIntegration";
import {
  Home as HomeIcon,
  FolderOpen,
  Footprints,
  Plus,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Loader2,
  AlertTriangle,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import { BottomTabNavigation } from "~/components/navigation/BottomTabNavigation";
import { checkAuth } from "~/utils/auth";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { dashboardQueries, shoeQueries, collectionQueries, runQueries } from "~/queries";
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Shoe Tracker | Track your running shoe stats with ease",
        description: `Shoe Tracker will allow you to track your running shoe stats with ease. It will help you to keep track of your running shoes and monitor your progress.`,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico" },
      {
        name: "theme-color",
        content: "#3b82f6",
        suppressHydrationWarning: true,
      },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "MyShoeTracker" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    // Check authentication status first (but don't redirect here)
    const authResult = await checkAuth(queryClient);

    if (authResult.isAuthenticated) {
      // Prefetch all critical app data in parallel
      // This ensures instant loading across the entire app
      await Promise.all([
        queryClient.prefetchQuery({
          ...dashboardQueries.data(),
          staleTime: 1000 * 60 * 10, // 10 minutes for dashboard data
        }),
        queryClient.prefetchQuery({
          ...shoeQueries.list(false),
          staleTime: 1000 * 60 * 5, // 5 minutes for shoes
        }),
        queryClient.prefetchQuery({
          ...collectionQueries.list(),
          staleTime: 1000 * 60 * 5, // 5 minutes for collections
        }),
        queryClient.prefetchQuery({
          ...runQueries.list(50),
          staleTime: 1000 * 60 * 2, // 2 minutes for recent runs
        }),
      ]);
    }

    return { isAuthenticated: authResult.isAuthenticated };
  },
  // Cache this loader result for the entire session
  staleTime: 1000 * 60 * 30, // 30 minutes
  gcTime: 1000 * 60 * 60, // 1 hour
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show enhanced loading screen while determining auth state
  if (isLoading) {
    return (
      <RootDocument>
        <div className="min-h-screen flex items-center justify-center bg-white relative">
          {/* Main loading content */}
          <div className="text-center px-6 max-w-md mx-auto">
            {/* Logo and branding */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-4 shadow-lg">
                <span className="text-4xl">🏃‍♂️</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">MyShoeTracker</h1>
              <p className="text-gray-600 text-lg">
                Track your running journey
              </p>
            </div>
          </div>
        </div>
      </RootDocument>
    );
  }

  return (
    <OfflineProvider>
      <RootDocument>
        <UpdateAvailableBanner />
        <LoadingIndicator />
        <Outlet />
        <PWAInstallPrompt />
      </RootDocument>
    </OfflineProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="ios-viewport-fix">
      <head>
        <PWAHead />
        <HeadContent />
      </head>
      <body className="ios-bounce-fix">
        <IOSStatusBar />
        <AppUpdateBanner />

        <div className="h-screen flex flex-col min-h-0 ios-viewport-fix">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg pwa-navigation">
            <div className="flex items-center justify-between py-3 px-4 sm:py-4 sm:px-6 lg:px-8 safe-area-p relative">
              <div className="flex items-center gap-4 lg:gap-8">
                <HeaderLeft />
                <div className="hidden lg:block">
                  <HeaderCenter />
                </div>
              </div>
              <div className="lg:hidden absolute left-1/2 transform -translate-x-1/2">
                <HeaderCenter />
              </div>
              <Navigation />
            </div>
          </div>

          <div className="flex-grow min-h-0 h-full flex flex-col">
            <div className="flex-1 pb-20 lg:pb-0 safe-area-p">{children}</div>
            <Toaster
              position="top-center"
              expand={true}
              richColors={true}
              closeButton={true}
              duration={4000}
              className="lg:!bottom-4 lg:!right-4 lg:!top-auto lg:!left-auto lg:!transform-none safe-area-top"
              toastOptions={{
                className:
                  "backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-700/50 shadow-xl",
                style: {
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(229, 231, 235, 0.5)",
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  borderRadius: "12px",
                  color: "#111827",
                  fontSize: "14px",
                  fontWeight: "500",
                },
              }}
            />
          </div>
          <BottomTabNavigation />
        </div>

        <IOSInstallBanner />
        <ServiceWorkerIntegration />
        {process.env.NODE_ENV === "development" && (
          <>
            <ReactQueryDevtools />
            <TanStackRouterDevtools position="bottom-right" />
          </>
        )}
        <Scripts />
      </body>
    </html>
  );
}

function LoadingIndicator() {
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite] transform -skew-x-12" />
        </div>
      </div>
    </div>
  );
}

function HeaderLeft() {
  return (
    <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
      {/* Online Indicator - Show on all screen sizes */}
      <OnlineIndicator />

      <div className="hidden sm:flex items-center gap-2">
        <LoadingIndicator />
      </div>
    </div>
  );
}

function HeaderCenter() {
  return (
    <Link to="/" className="contents">
      <div className="font-black text-xl sm:text-2xl text-white lg:text-left">
        🏃‍♂️ MyShoeTracker
      </div>
      <div className="text-slate-400 text-xs sm:text-sm hidden sm:block lg:text-left">
        Track your running shoe stats with ease
      </div>
    </Link>
  );
}

function OnlineIndicator() {
  const [isOnline, setIsOnline] = React.useState(true); // Default to online
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // Set client flag and initial online status
    setIsClient(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't render during SSR
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-400" : "bg-red-400"
        }`}
        title={isOnline ? "Online" : "Offline"}
      />
    </div>
  );
}

function Navigation() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen || mobileMenuOpen) {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    if (userMenuOpen || mobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [userMenuOpen, mobileMenuOpen]);

  // Handle sign out with error handling
  const handleSignOut = async () => {
    try {
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <nav className="flex items-center">
        {!isLoading && (
          <Link
            to="/auth/signin"
            search={{ redirect: "/" }}
            className="text-slate-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            Sign In
          </Link>
        )}
      </nav>
    );
  }

  const navigationLinks = [
    { to: "/collections", icon: FolderOpen, label: "Collections" },
    { to: "/shoes", icon: Footprints, label: "Shoes" },
    { to: "/runs", icon: HomeIcon, label: "Runs" },
    { to: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-6">
        {navigationLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center text-slate-300 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-slate-800/50"
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Link>
        ))}

        {/* Desktop PWA Status Bar */}
        <div className="hidden xl:flex items-center gap-4">
          {/* <PWAStatusBar /> */}
        </div>

        <Link
          to="/runs/new"
          search={{ modal: false }}
          className="flex items-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-lg button-hover"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Run
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-inner">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
              ) : null}
              <div
                className={`flex items-center justify-center w-full h-full text-white ${user?.image ? "hidden" : ""}`}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || (
                  <User className="w-4 h-4" />
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                <div className="font-semibold truncate">
                  {user?.name || "User"}
                </div>
                {user?.email && (
                  <div className="text-gray-500 truncate text-xs mt-1">
                    {user.email}
                  </div>
                )}
              </div>
              <Link
                to="/profile"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Profile Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation - Simplified since we have bottom tabs */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {navigationLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-50 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </Link>
          ))}
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-inner">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
              ) : null}
              <div
                className={`flex items-center justify-center w-full h-full text-white ${user?.image ? "hidden" : ""}`}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 truncate">
                {user?.name || "User"}
              </div>
              {user?.email && (
                <div className="text-gray-500 truncate text-sm">
                  {user.email}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Link
              to="/profile"
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-50 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="w-5 h-5 mr-3" />
              Profile Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full text-left text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-lg hover:bg-gray-50 font-medium"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
