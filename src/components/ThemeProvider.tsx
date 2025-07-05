import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  type Theme,
  type ResolvedTheme,
  type ThemeConfig,
  resolveTheme,
  applyTheme,
  setStoredTheme,
  createSystemThemeListener,
  getNextTheme,
} from "../lib/theme";

const ThemeContext = createContext<ThemeConfig | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Use theme from script or fallback to system
    if (typeof window !== "undefined" && (window as any).__THEME_STATE__) {
      return (window as any).__THEME_STATE__.theme;
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    // Use resolved theme from script or fallback to light
    if (typeof window !== "undefined" && (window as any).__THEME_STATE__) {
      return (window as any).__THEME_STATE__.resolvedTheme;
    }
    return "light";
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    // Mark as hydrated and sync with any theme state from script
    if (typeof window !== "undefined" && (window as any).__THEME_STATE__) {
      const themeState = (window as any).__THEME_STATE__;
      setThemeState(themeState.theme);
      setResolvedTheme(themeState.resolvedTheme);

      // Mark script state as hydrated
      themeState.isHydrated = true;
    }

    setIsHydrated(true);
  }, []);

  // Handle theme changes
  const updateTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const newResolvedTheme = resolveTheme(newTheme);
    setResolvedTheme(newResolvedTheme);

    // Store in localStorage
    setStoredTheme(newTheme);

    // Apply to DOM
    applyTheme(newResolvedTheme);
  }, []);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (!isHydrated || theme !== "system") return;

    const cleanup = createSystemThemeListener((systemTheme) => {
      setResolvedTheme(systemTheme);
      applyTheme(systemTheme);
    });

    return cleanup;
  }, [theme, isHydrated]);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    const nextTheme = getNextTheme(theme);
    updateTheme(nextTheme);
  }, [theme, updateTheme]);

  const value: ThemeConfig = {
    theme,
    resolvedTheme,
    setTheme: updateTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeConfig {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Hook for checking if theme is dark
export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark";
}

// Hook for checking if theme is light
export function useIsLight(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "light";
}

// Hook for getting theme-aware styles
export function useThemeAwareStyles() {
  const { resolvedTheme } = useTheme();

  return {
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
    themeClass: resolvedTheme,
    backgroundColor: resolvedTheme === "dark" ? "#0f172a" : "#ffffff",
    textColor: resolvedTheme === "dark" ? "#f1f5f9" : "#0f172a",
    borderColor: resolvedTheme === "dark" ? "#374151" : "#e5e7eb",
  };
}

// HOC for theme-aware components
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: ResolvedTheme }>,
) {
  return function ThemedComponent(props: P) {
    const { resolvedTheme } = useTheme();
    return <Component {...props} theme={resolvedTheme} />;
  };
}
