export type Theme = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

export interface ThemeConfig {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "shoes-app-theme";

/**
 * Get the current system theme preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Get stored theme preference from localStorage
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ["light", "dark", "system"].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    console.warn("Failed to read theme from localStorage:", error);
  }

  return null;
}

/**
 * Store theme preference in localStorage
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Failed to store theme in localStorage:", error);
  }
}

/**
 * Resolve theme to actual theme (system -> light/dark)
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(resolvedTheme: ResolvedTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (resolvedTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Update meta theme-color for mobile browsers
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    const color = resolvedTheme === "dark" ? "#0f172a" : "#3b82f6";
    themeColorMeta.setAttribute("content", color);
  }
}

/**
 * Get initial theme preference
 * Priority: stored theme > system theme > light
 */
export function getInitialTheme(): Theme {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  // Default to system preference
  return "system";
}

/**
 * Create theme script for SSR
 * This script runs before React hydrates to prevent FOUC
 */
export function createThemeScript(): string {
  return `
    (function() {
      function getStoredTheme() {
        try {
          return localStorage.getItem('${THEME_STORAGE_KEY}');
        } catch (e) {
          return null;
        }
      }

      function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      function resolveTheme(theme) {
        if (theme === 'system' || !theme) {
          return getSystemTheme();
        }
        return theme;
      }

      function applyTheme(resolvedTheme) {
        if (resolvedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Update theme-color meta tag
        var themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
          var color = resolvedTheme === 'dark' ? '#0f172a' : '#3b82f6';
          themeColorMeta.setAttribute('content', color);
        }
      }

      // Get initial theme
      var storedTheme = getStoredTheme();
      var initialTheme = storedTheme || 'system';
      var resolvedTheme = resolveTheme(initialTheme);

      // Apply theme immediately
      applyTheme(resolvedTheme);

      // Store the resolved theme temporarily for hydration
      window.__INITIAL_THEME__ = initialTheme;
      window.__INITIAL_RESOLVED_THEME__ = resolvedTheme;
    })();
  `;
}

/**
 * Listen for system theme changes
 */
export function createSystemThemeListener(
  callback: (theme: ResolvedTheme) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
    callback(event.matches ? "dark" : "light");
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }

  // Legacy browsers
  try {
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  } catch (error) {
    console.warn("Failed to add system theme listener:", error);
    return () => {};
  }
}

/**
 * Get next theme in cycle (for toggle button)
 */
export function getNextTheme(currentTheme: Theme): Theme {
  switch (currentTheme) {
    case "light":
      return "dark";
    case "dark":
      return "system";
    case "system":
      return "light";
    default:
      return "light";
  }
}

/**
 * Get theme display name
 */
export function getThemeDisplayName(theme: Theme): string {
  switch (theme) {
    case "light":
      return "Light";
    case "dark":
      return "Dark";
    case "system":
      return "System";
    default:
      return "Unknown";
  }
}

/**
 * Check if theme is dark
 */
export function isDarkTheme(resolvedTheme: ResolvedTheme): boolean {
  return resolvedTheme === "dark";
}

/**
 * Check if theme is light
 */
export function isLightTheme(resolvedTheme: ResolvedTheme): boolean {
  return resolvedTheme === "light";
}

// Type declarations for window globals
declare global {
  interface Window {
    __THEME_STATE__?: {
      theme: Theme;
      resolvedTheme: ResolvedTheme;
      isHydrated: boolean;
    };
  }
}
