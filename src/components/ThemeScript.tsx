import React from "react";

/**
 * Optimized theme script that prevents hydration mismatches
 * This runs immediately and consistently applies the theme
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              // Theme storage key
              var STORAGE_KEY = 'shoes-app-theme';

              // Get stored theme preference
              function getStoredTheme() {
                try {
                  var stored = localStorage.getItem(STORAGE_KEY);
                  return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : null;
                } catch (e) {
                  return null;
                }
              }

              // Get system theme preference
              function getSystemTheme() {
                try {
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                } catch (e) {
                  return 'light';
                }
              }

              // Resolve theme to actual light/dark value
              function resolveTheme(theme) {
                if (theme === 'system' || !theme) {
                  return getSystemTheme();
                }
                return theme === 'dark' ? 'dark' : 'light';
              }

              // Apply theme to DOM
              function applyTheme(resolvedTheme) {
                var root = document.documentElement;

                if (resolvedTheme === 'dark') {
                  root.classList.add('dark');
                  root.setAttribute('data-theme', 'dark');
                } else {
                  root.classList.remove('dark');
                  root.setAttribute('data-theme', 'light');
                }

                // Update or create theme-color meta tag for mobile browsers
                var themeColorMeta = document.querySelector('meta[name="theme-color"]');
                if (!themeColorMeta) {
                  themeColorMeta = document.createElement('meta');
                  themeColorMeta.setAttribute('name', 'theme-color');
                  document.head.appendChild(themeColorMeta);
                }
                themeColorMeta.setAttribute('content', resolvedTheme === 'dark' ? '#0f172a' : '#3b82f6');
              }

              // Initialize theme
              var storedTheme = getStoredTheme();
              var initialTheme = storedTheme || 'system';
              var resolvedTheme = resolveTheme(initialTheme);

              // Apply theme immediately to prevent FOUC
              applyTheme(resolvedTheme);

              // Store values for React hydration (avoid hydration mismatch)
              window.__THEME_STATE__ = {
                theme: initialTheme,
                resolvedTheme: resolvedTheme,
                isHydrated: false
              };

            } catch (error) {
              // Fallback to light theme if anything fails
              console.warn('Theme initialization failed:', error);
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
              window.__THEME_STATE__ = {
                theme: 'light',
                resolvedTheme: 'light',
                isHydrated: false
              };
            }
          })();
        `,
      }}
      suppressHydrationWarning={true}
    />
  );
}
