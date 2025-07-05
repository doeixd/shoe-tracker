import { createFileRoute } from "@tanstack/react-router";
import {
  useTheme,
  useIsDark,
  useThemeAwareStyles,
} from "~/components/ThemeProvider";
import {
  ThemeToggle,
  CompactThemeToggle,
  NavThemeToggle,
} from "~/components/ThemeToggle";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Check,
  X,
  Info,
  AlertTriangle,
} from "lucide-react";

function ThemeDemoPage() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const isDark = useIsDark();
  const themeStyles = useThemeAwareStyles();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Dark Mode Demo
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Interactive demonstration of the dark mode theme system with SSR
            support, user preferences, and smooth transitions.
          </p>
        </div>

        {/* Theme Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              {theme === "light" && <Sun className="w-5 h-5 text-yellow-500" />}
              {theme === "dark" && <Moon className="w-5 h-5 text-blue-500" />}
              {theme === "system" && (
                <Monitor className="w-5 h-5 text-gray-500" />
              )}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Current Preference
              </h3>
            </div>
            <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 capitalize">
              {theme}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              User's theme preference
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              {resolvedTheme === "light" && (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              {resolvedTheme === "dark" && (
                <Moon className="w-5 h-5 text-blue-500" />
              )}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Active Theme
              </h3>
            </div>
            <p className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 capitalize">
              {resolvedTheme}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Currently applied theme
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-5 h-5 rounded-full ${isDark ? "bg-gray-800 dark:bg-gray-200" : "bg-yellow-400"}`}
              />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Dark Mode
              </h3>
            </div>
            <p
              className={`text-2xl font-mono font-bold ${isDark ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`}
            >
              {isDark ? "Active" : "Inactive"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current state
            </p>
          </div>
        </div>

        {/* Theme Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Theme Controls
          </h2>

          <div className="space-y-8">
            {/* Toggle Variants */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Cycle Toggle
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cycles through: Light → Dark → System
                </p>
                <div className="flex items-center gap-4">
                  <ThemeToggle variant="cycle" size="sm" />
                  <ThemeToggle variant="cycle" size="md" />
                  <ThemeToggle variant="cycle" size="lg" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Button Group
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Direct selection of any theme
                </p>
                <div className="space-y-3">
                  <ThemeToggle variant="button" size="sm" />
                  <ThemeToggle variant="button" size="md" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Dropdown Select
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compact dropdown selection
                </p>
                <div className="flex items-center gap-4">
                  <ThemeToggle variant="dropdown" size="sm" />
                  <ThemeToggle variant="dropdown" size="md" />
                </div>
              </div>
            </div>

            {/* Compact Variants */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Compact Variants
              </h3>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compact
                  </p>
                  <CompactThemeToggle />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Navigation
                  </p>
                  <NavThemeToggle />
                </div>
              </div>
            </div>

            {/* Direct Controls */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Direct Theme Selection
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    theme === "light"
                      ? "bg-yellow-500 text-white shadow-lg"
                      : "bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                  }`}
                >
                  <Sun className="w-4 h-4 inline mr-2" />
                  Light Mode
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    theme === "dark"
                      ? "bg-gray-800 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <Moon className="w-4 h-4 inline mr-2" />
                  Dark Mode
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    theme === "system"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200"
                  }`}
                >
                  <Monitor className="w-4 h-4 inline mr-2" />
                  System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Components Demo */}
        <div className="space-y-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            Component Examples
          </h2>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                Standard Card
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This card demonstrates standard background and text colors that
                adapt to the theme.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Primary Action
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
                Gradient Card
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Gradient backgrounds with theme-aware colors for visual
                hierarchy.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Action Button
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">
                Subtle Card
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Subtle backgrounds for secondary content areas.
              </p>
              <button className="w-full bg-gray-800 dark:bg-gray-200 hover:bg-gray-900 dark:hover:bg-gray-300 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors">
                Secondary Action
              </button>
            </div>
          </div>

          {/* Status Messages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Status Messages
              </h3>

              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-300 font-medium">
                  Success message
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-800 dark:text-blue-300 font-medium">
                  Information message
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-800 dark:text-yellow-300 font-medium">
                  Warning message
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-300 font-medium">
                  Error message
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Form Elements
              </h3>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Text input field"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <textarea
                  placeholder="Textarea field"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Theme Values Debug */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">
              Theme System Values
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current State
                </h4>
                <pre className="text-sm font-mono bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {JSON.stringify({ theme, resolvedTheme, isDark }, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Theme Styles
                </h4>
                <pre className="text-sm font-mono bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {JSON.stringify(themeStyles, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Dark mode implementation with SSR support, user preferences, and
            smooth transitions.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Theme preference is stored in localStorage and respects system
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/theme-demo")({
  component: ThemeDemoPage,
});
