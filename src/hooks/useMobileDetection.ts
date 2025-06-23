import { useState, useEffect } from "react";

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1024,
  });

  useEffect(() => {
    const checkDevice = () => {
      const screenWidth = window.innerWidth;
      const isTouchDevice = "ontouchstart" in window;
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileUserAgent =
        /android|iphone|ipad|ipod|blackberry|windows phone|mobile/.test(
          userAgent,
        );

      // Screen size breakpoints
      const isMobileScreen = screenWidth < 768; // md breakpoint
      const isTabletScreen = screenWidth >= 768 && screenWidth < 1024; // lg breakpoint
      const isDesktopScreen = screenWidth >= 1024;

      // Combine screen size with touch/user agent detection
      const isMobile = isMobileScreen || (isTouchDevice && mobileUserAgent && screenWidth < 1024);
      const isTablet = isTabletScreen && !isMobile;
      const isDesktop = isDesktopScreen && !isTouchDevice && !mobileUserAgent;

      setDetection({
        isMobile,
        isTablet,
        isDesktop: isDesktop || (!isMobile && !isTablet), // Default to desktop if not mobile/tablet
        screenWidth,
      });
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    mediaQuery.addEventListener("change", checkDevice);
    window.addEventListener("resize", checkDevice);

    return () => {
      mediaQuery.removeEventListener("change", checkDevice);
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return detection;
}

// Static version for immediate use (without reactivity)
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const screenWidth = window.innerWidth;
  const isTouchDevice = "ontouchstart" in window;
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileUserAgent =
    /android|iphone|ipad|ipod|blackberry|windows phone|mobile/.test(userAgent);

  return screenWidth < 1024 && (isTouchDevice || mobileUserAgent);
}
