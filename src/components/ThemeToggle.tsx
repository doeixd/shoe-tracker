import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { getThemeDisplayName, type Theme } from '../lib/theme';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'dropdown' | 'cycle';
}

export function ThemeToggle({
  className = '',
  size = 'md',
  variant = 'cycle'
}: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  if (variant === 'cycle') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          inline-flex items-center justify-center
          rounded-lg
          bg-white/80 hover:bg-white
          dark:bg-gray-800/80 dark:hover:bg-gray-800
          border border-gray-200 dark:border-gray-700
          text-gray-700 dark:text-gray-300
          hover:text-gray-900 dark:hover:text-gray-100
          shadow-sm hover:shadow-md
          transition-all duration-200
          backdrop-blur-sm
          touch-manipulation
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${className}
        `}
        aria-label={`Switch to ${getThemeDisplayName(getNextTheme(theme))} theme`}
        title={`Current: ${getThemeDisplayName(theme)} • Click to cycle`}
      >
        <ThemeIcon theme={theme} size={iconSizes[size]} />
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
          className={`
            ${sizeClasses[size]}
            appearance-none
            bg-white/80 hover:bg-white
            dark:bg-gray-800/80 dark:hover:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg
            text-gray-700 dark:text-gray-300
            shadow-sm hover:shadow-md
            transition-all duration-200
            backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-900
            pr-8
          `}
          aria-label="Select theme"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ThemeIcon theme={theme} size={iconSizes[size]} />
        </div>
      </div>
    );
  }

  // Button variant with separate buttons
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 dark:border-gray-700 ${className}`} role="group" aria-label="Theme selection">
      {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
        <button
          key={themeOption}
          onClick={() => setTheme(themeOption)}
          className={`
            ${sizeClasses[size]}
            inline-flex items-center justify-center
            first:rounded-l-lg last:rounded-r-lg
            border-r border-gray-200 dark:border-gray-700 last:border-r-0
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-900
            ${
              theme === themeOption
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
          aria-label={`Switch to ${getThemeDisplayName(themeOption)} theme`}
          aria-pressed={theme === themeOption}
        >
          <ThemeIcon theme={themeOption} size={iconSizes[size]} />
        </button>
      ))}
    </div>
  );
}

function ThemeIcon({ theme, size }: { theme: Theme; size: number }) {
  switch (theme) {
    case 'light':
      return <Sun size={size} />;
    case 'dark':
      return <Moon size={size} />;
    case 'system':
      return <Monitor size={size} />;
    default:
      return <Monitor size={size} />;
  }
}

function getNextTheme(currentTheme: Theme): Theme {
  switch (currentTheme) {
    case 'light':
      return 'dark';
    case 'dark':
      return 'system';
    case 'system':
      return 'light';
    default:
      return 'light';
  }
}

// Compact version for mobile/small spaces
export function CompactThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        w-9 h-9
        inline-flex items-center justify-center
        rounded-full
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-600 dark:text-gray-400
        hover:text-gray-900 dark:hover:text-gray-100
        transition-all duration-200
        touch-manipulation
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${className}
      `}
      aria-label={`Current theme: ${getThemeDisplayName(theme)} • Tap to cycle`}
    >
      <ThemeIcon theme={theme} size={16} />
    </button>
  );
}

// Theme toggle for navigation/header
export function NavThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        w-8 h-8
        inline-flex items-center justify-center
        rounded-md
        text-gray-500 hover:text-gray-700
        dark:text-gray-400 dark:hover:text-gray-200
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all duration-200
        touch-manipulation
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900
        ${className}
      `}
      aria-label={`Switch theme (currently ${getThemeDisplayName(theme)})`}
    >
      <ThemeIcon theme={theme} size={16} />
    </button>
  );
}
