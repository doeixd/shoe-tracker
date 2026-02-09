/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        accent: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        chart: {
          1: "#3b82f6",
          2: "#10b981",
          3: "#f59e0b",
          4: "#ef4444",
          5: "#8b5cf6",
          6: "#06b6d4",
          7: "#84cc16",
          8: "#f97316",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04)",
        large:
          "0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "fade-in-fast": "fadeIn 0.1s ease-out",
        "slide-up": "slideUp 0.15s ease-out",
        "slide-up-fast": "slideUp 0.1s ease-out",
        "slide-down": "slideDown 0.15s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
        "scale-in-fast": "scaleIn 0.1s ease-out",
        "micro-bounce": "microBounce 0.1s ease-out",
        "quick-scale": "quickScale 0.1s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-gentle": "bounceGentle 2s infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translate3d(0, 5px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        slideUp: {
          "0%": { transform: "translate3d(0, 10px, 0)", opacity: "0" },
          "100%": { transform: "translate3d(0, 0, 0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translate3d(0, -10px, 0)", opacity: "0" },
          "100%": { transform: "translate3d(0, 0, 0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale3d(0.98, 0.98, 1)", opacity: "0" },
          "100%": { transform: "scale3d(1, 1, 1)", opacity: "1" },
        },
        microBounce: {
          "0%, 100%": { transform: "scale3d(1, 1, 1)" },
          "50%": { transform: "scale3d(1.02, 1.02, 1)" },
        },
        quickScale: {
          "0%": { transform: "scale3d(0.99, 0.99, 1)" },
          "100%": { transform: "scale3d(1, 1, 1)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -5px, 0)" },
        },
        shimmer: {
          "0%": { transform: "translate3d(-100%, 0, 0)" },
          "100%": { transform: "translate3d(100%, 0, 0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      screens: {
        xs: "475px",
        "3xl": "1680px",
      },
      gradientColorStops: {
        "primary-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "success-gradient": "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        "warning-gradient": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "chart-gradient":
          "linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.1) 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    function ({ addUtilities }) {
      const newUtilities = {
        // Safe area utilities for mobile
        ".pb-safe": {
          "padding-bottom": "env(safe-area-inset-bottom)",
        },
        ".pt-safe": {
          "padding-top": "env(safe-area-inset-top)",
        },
        ".px-safe": {
          "padding-left": "env(safe-area-inset-left)",
          "padding-right": "env(safe-area-inset-right)",
        },
        ".p-safe": {
          "padding-top": "env(safe-area-inset-top)",
          "padding-right": "env(safe-area-inset-right)",
          "padding-bottom": "env(safe-area-inset-bottom)",
          "padding-left": "env(safe-area-inset-left)",
        },
        // Dynamic viewport height utilities
        ".h-dvh": {
          height: "100dvh",
        },
        ".min-h-dvh": {
          "min-height": "100dvh",
        },
        ".max-h-dvh": {
          "max-height": "100dvh",
        },
        ".text-gradient": {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".glass": {
          background: "rgba(255, 255, 255, 0.1)",
          "backdrop-filter": "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".glass-dark": {
          background: "rgba(0, 0, 0, 0.1)",
          "backdrop-filter": "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".card-hover": {
          transition: "transform 0.1s ease-out, box-shadow 0.1s ease-out",
          "will-change": "transform, box-shadow",
          "&:hover": {
            transform: "translate3d(0, -1px, 0)",
            "box-shadow":
              "0 8px 30px -8px rgba(0, 0, 0, 0.12), 0 15px 20px -5px rgba(0, 0, 0, 0.06)",
          },
        },
        ".button-hover": {
          transition: "all 0.1s ease-out",
          "will-change": "transform, box-shadow",
          "&:hover": {
            transform: "translate3d(0, -1px, 0)",
            "box-shadow": "0 4px 15px rgba(0, 0, 0, 0.2)",
          },
          "&:active": {
            transform: "translate3d(0, 0, 0)",
            "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.15)",
          },
        },
        ".gradient-primary": {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        ".gradient-success": {
          background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        },
        ".gradient-warning": {
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        },
        ".gradient-chart": {
          background:
            "linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.1) 100%)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
