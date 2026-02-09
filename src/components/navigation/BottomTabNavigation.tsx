import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Footprints, Activity, BarChart3, Plus } from "lucide-react";
import { cn } from "~/components/ui/ui";
import { useAuth } from "~/components/AuthProvider";

interface TabItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isCenter?: boolean;
}

const tabs: TabItem[] = [
  {
    to: "/",
    icon: Home,
    label: "Home",
  },
  {
    to: "/runs",
    icon: Activity,
    label: "Runs",
  },
  {
    to: "/runs/new",
    icon: Plus,
    label: "Record",
    isCenter: true,
  },
  {
    to: "/shoes",
    icon: Footprints,
    label: "Shoes",
  },
  {
    to: "/analytics",
    icon: BarChart3,
    label: "Analytics",
  },
];

export function BottomTabNavigation() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const { isAuthenticated } = useAuth();

  // Helper function to determine if a tab is active
  const isTabActive = (tabPath: string) => {
    if (tabPath === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(tabPath);
  };

  // Don't show bottom navigation if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Background with blur effect */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-t border-gray-200/50" />

        {/* Safe area padding */}
        <div className="relative px-safe pb-safe">
          <div className="flex items-center justify-around px-2 py-2 min-h-[64px]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = isTabActive(tab.to);

              if (tab.isCenter) {
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    search={{ modal: true }}
                    className="flex flex-col items-center justify-center relative"
                  >
                    <div className="w-12 h-12 -mt-5 bg-gray-900 rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all duration-200 active:scale-95 ring-4 ring-white">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-900 mt-1">
                      {tab.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 min-w-[48px] transition-colors duration-200 relative",
                    isActive
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 mb-1",
                      isActive ? "text-gray-900" : "text-gray-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      isActive ? "text-gray-900" : "text-gray-400",
                    )}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-gray-900" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom padding spacer for page content - only when authenticated */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
