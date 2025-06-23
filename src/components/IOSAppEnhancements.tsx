import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";

interface IOSAppEnhancementsProps {
  children?: React.ReactNode;
}

export function IOSAppEnhancements({ children }: IOSAppEnhancementsProps) {
  const router = useRouter();
  const [isIOSPWA, setIsIOSPWA] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100vh");

  // Detect iOS PWA mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isIOSStandalone = isIOS && isStandalone;

    setIsIOSPWA(isIOSStandalone);

    // iOS viewport height fix
    if (isIOS) {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        setViewportHeight(`${window.innerHeight}px`);
      };

      setVH();
      window.addEventListener("resize", setVH);
      window.addEventListener("orientationchange", setVH);

      return () => {
        window.removeEventListener("resize", setVH);
        window.removeEventListener("orientationchange", setVH);
      };
    }
  }, []);

  // iOS scroll behavior fixes
  useEffect(() => {
    if (!isIOSPWA) return;

    // Prevent bounce scroll
    const preventBounce = (e: TouchEvent) => {
      const target = e.target as HTMLElement;

      // Allow scrolling within scrollable containers
      if (
        target.closest(".ios-scrollable") ||
        target.closest("[data-scrollable]")
      ) {
        return;
      }

      // Prevent default bounce behavior
      if (
        document.body.scrollTop === 0 &&
        e.touches[0].clientY > e.touches[0].clientX
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventBounce, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventBounce);
    };
  }, [isIOSPWA]);

  // iOS back button handling
  useEffect(() => {
    if (!isIOSPWA) return;

    const handlePopState = (event: PopStateEvent) => {
      // Custom back button behavior for iOS PWA
      console.log("[iOS PWA] Back button pressed");

      // You can add custom logic here
      // For example, show a confirmation dialog or handle specific routes
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isIOSPWA, router]);

  // iOS keyboard handling
  useEffect(() => {
    if (!isIOSPWA) return;

    let initialViewportHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;

      // Keyboard is likely open if height decreased significantly
      if (heightDifference > 150) {
        document.body.classList.add("ios-keyboard-open");
        // Adjust layout for keyboard
        document.documentElement.style.setProperty(
          "--keyboard-height",
          `${heightDifference}px`,
        );
      } else {
        document.body.classList.remove("ios-keyboard-open");
        document.documentElement.style.setProperty("--keyboard-height", "0px");
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.classList.remove("ios-keyboard-open");
    };
  }, [isIOSPWA]);

  // iOS focus management
  useEffect(() => {
    if (!isIOSPWA) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // Scroll focused input into view
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    };

    const handleFocusOut = () => {
      // Restore viewport when input loses focus
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [isIOSPWA]);

  // iOS haptic feedback
  const hapticFeedback = useCallback(
    (type: "light" | "medium" | "heavy" = "light") => {
      if (!isIOSPWA || typeof window === "undefined") return;

      try {
        // iOS-specific haptic feedback
        if ("vibrate" in navigator) {
          const patterns = {
            light: [10],
            medium: [30],
            heavy: [50],
          };
          navigator.vibrate(patterns[type]);
        }

        // Web Haptic API (if available)
        if ("hapticFeedback" in navigator) {
          (navigator as any).hapticFeedback.vibrate(type);
        }
      } catch (error) {
        console.debug("[iOS PWA] Haptic feedback not available");
      }
    },
    [isIOSPWA],
  );

  // iOS orientation handling
  useEffect(() => {
    if (!isIOSPWA) return;

    const handleOrientationChange = () => {
      // Force layout recalculation after orientation change
      setTimeout(() => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        setViewportHeight(`${window.innerHeight}px`);

        // Trigger a resize event for components that need it
        window.dispatchEvent(new Event("resize"));
      }, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isIOSPWA]);

  // iOS status bar handling
  useEffect(() => {
    if (!isIOSPWA) return;

    // Add iOS PWA class to body
    document.body.classList.add("ios-pwa");

    // Set status bar color based on theme
    const metaStatusBar = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );
    if (metaStatusBar) {
      // Check if dark mode
      const isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      metaStatusBar.setAttribute(
        "content",
        isDarkMode ? "black-translucent" : "default",
      );
    }

    return () => {
      document.body.classList.remove("ios-pwa");
    };
  }, [isIOSPWA]);

  // Provide haptic feedback context
  useEffect(() => {
    if (!isIOSPWA) return;

    // Add haptic feedback to global window object for easy access
    (window as any).hapticFeedback = hapticFeedback;

    return () => {
      delete (window as any).hapticFeedback;
    };
  }, [isIOSPWA, hapticFeedback]);

  // iOS-specific styles
  const iosStyles = isIOSPWA
    ? {
        height: viewportHeight,
        minHeight: viewportHeight,
        maxHeight: viewportHeight,
        overflow: "hidden",
        position: "fixed" as const,
        width: "100%",
        top: 0,
        left: 0,
      }
    : {};

  return (
    <div
      className={`ios-app-container ${isIOSPWA ? "ios-pwa-mode" : ""}`}
      style={iosStyles}
    >
      {/* iOS PWA Status Bar Spacer */}
      {isIOSPWA && (
        <div
          className="ios-status-bar-spacer"
          style={{
            height: "env(safe-area-inset-top)",
            backgroundColor: "var(--header-bg, #1e293b)",
            width: "100%",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1000,
          }}
        />
      )}

      {/* Main Content */}
      <div
        className={`ios-main-content ${isIOSPWA ? "ios-scrollable" : ""}`}
        style={
          isIOSPWA
            ? {
                height: "100%",
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
                paddingLeft: "env(safe-area-inset-left)",
                paddingRight: "env(safe-area-inset-right)",
              }
            : {}
        }
      >
        {children}
      </div>

      {/* iOS PWA Debug Info (development only) */}
      {isIOSPWA && process.env.NODE_ENV === "development" && (
        <div
          className="ios-debug-info"
          style={{
            position: "fixed",
            bottom: "env(safe-area-inset-bottom)",
            right: "env(safe-area-inset-right)",
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            fontSize: "10px",
            borderRadius: "4px",
            zIndex: 9999,
            fontFamily: "monospace",
          }}
        >
          iOS PWA Mode • {viewportHeight}
        </div>
      )}

      {/* iOS-specific CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ios-pwa-mode {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }

        .ios-pwa-mode * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .ios-keyboard-open .ios-main-content {
          padding-bottom: calc(env(safe-area-inset-bottom) + var(--keyboard-height, 0px));
        }

        /* iOS safe area variables */
        :root {
          --ios-safe-top: env(safe-area-inset-top);
          --ios-safe-right: env(safe-area-inset-right);
          --ios-safe-bottom: env(safe-area-inset-bottom);
          --ios-safe-left: env(safe-area-inset-left);
        }

        /* iOS scroll fixes */
        .ios-pwa-mode body {
          position: fixed;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }

        .ios-scrollable {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }

        /* iOS button enhancements */
        .ios-pwa-mode button,
        .ios-pwa-mode [role="button"] {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        /* iOS input fixes */
        .ios-pwa-mode input,
        .ios-pwa-mode textarea,
        .ios-pwa-mode select {
          -webkit-appearance: none;
          -webkit-border-radius: 0;
          border-radius: 8px;
          font-size: 16px !important; /* Prevent zoom */
        }

        /* iOS focus management */
        .ios-pwa-mode input:focus,
        .ios-pwa-mode textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* iOS modal fixes */
        .ios-pwa-mode .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        /* iOS animation optimizations */
        .ios-pwa-mode * {
          will-change: auto;
        }

        .ios-pwa-mode .animating {
          will-change: transform, opacity;
        }

        /* iOS pull-to-refresh prevention */
        .ios-pwa-mode {
          overscroll-behavior: none;
        }

        /* iOS dark mode support */
        @media (prefers-color-scheme: dark) {
          .ios-status-bar-spacer {
            background-color: var(--header-bg-dark, #0f172a) !important;
          }
        }
        `,
        }}
      />
    </div>
  );
}

export default IOSAppEnhancements;
