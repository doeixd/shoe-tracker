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
        href: "https://fav.farm/🏃🏼‍♀️",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "https://fav.farm/🏃🏼‍♀️",
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "https://fav.farm/🏃🏼‍♀️" },
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
                <span className="text-4xl">🏃🏼‍♀️</span>
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
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <html className="ios-viewport-fix" suppressHydrationWarning>
      <head>
        <PWAHead />
        <HeadContent />
      </head>
      <body className="ios-bounce-fix" suppressHydrationWarning>
        {isHydrated ? <IOSStatusBar /> : null}
        {isHydrated ? <AppUpdateBanner /> : null}

        <div className="h-screen flex flex-col min-h-0 ios-viewport-fix">
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm pwa-navigation sticky top-0 z-40">
            <div className="flex items-center justify-between py-3 px-4 sm:py-3.5 sm:px-6 lg:px-8 safe-area-p relative max-w-7xl mx-auto w-full">
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
            {isHydrated ? (
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
            ) : null}
          </div>
          <BottomTabNavigation />
        </div>

        {isHydrated ? <IOSInstallBanner /> : null}
        <ServiceWorkerIntegration />
        {import.meta.env.DEV && (
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
      <div className="h-0.5 bg-gray-100">
        <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 relative overflow-hidden animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite] transform -skew-x-12" />
        </div>
      </div>
    </div>
  );
}

function HeaderLeft() {
  return (
    <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
      <OnlineIndicator />
    </div>
  );
}

function HeaderCenter() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
        <span className="text-sm">🏃🏼‍♀️</span>
      </div>
      <div>
        <div className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">
          ShoeTracker
        </div>
        <div className="text-gray-500 text-xs hidden sm:block leading-tight lg:text-left">
          Track your running shoes
        </div>
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
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-4 py-2 rounded-xl hover:bg-gray-100 text-sm"
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
      <nav className="hidden lg:flex items-center gap-1">
        {navigationLinks.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium px-3 py-2 rounded-xl hover:bg-gray-100/80 text-sm"
          >
            <Icon className="w-4 h-4 mr-1.5 opacity-70" />
            {label}
          </Link>
        ))}

        <div className="w-px h-6 bg-gray-200 mx-2" />

        <Link
          to="/runs/new"
          search={{ modal: false }}
          className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Log Run
        </Link>

        {/* User Menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-xl hover:bg-gray-100/80"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
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
                className={`flex items-center justify-center w-full h-full text-white text-sm font-semibold ${user?.image ? "hidden" : ""}`}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || (
                  <User className="w-4 h-4" />
                )}
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-large border border-gray-200/60 py-1.5 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {user?.name || "User"}
                </div>
                {user?.email && (
                  <div className="text-gray-500 truncate text-xs mt-0.5">
                    {user.email}
                  </div>
                )}
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg mx-1.5"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-400" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg mx-1.5"
                >
                  <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Navigation - Simplified since we have bottom tabs */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100/80"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
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
        className={`fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-sm">🏃🏼‍♀️</span>
              </div>
              <span className="font-bold text-gray-900">ShoeTracker</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-1">
          {navigationLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors p-3 rounded-xl hover:bg-gray-50 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon className="w-5 h-5 mr-3 text-gray-400" />
              {label}
            </Link>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
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
                className={`flex items-center justify-center w-full h-full text-white font-semibold ${user?.image ? "hidden" : ""}`}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate text-sm">
                {user?.name || "User"}
              </div>
              {user?.email && (
                <div className="text-gray-500 truncate text-xs">
                  {user.email}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Link
              to="/profile"
              className="flex items-center text-gray-700 hover:text-gray-900 transition-colors p-2.5 rounded-xl hover:bg-white font-medium text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Profile Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full text-left text-red-600 hover:text-red-700 transition-colors p-2.5 rounded-xl hover:bg-red-50 font-medium text-sm"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
