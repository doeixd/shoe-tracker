import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device
 * Uses both CSS media query and user agent detection for better accuracy
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if device is mobile
    const checkIsMobile = () => {
      // Check screen width
      const isSmallScreen = window.innerWidth < breakpoint;

      // Check user agent for mobile indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        'android',
        'iphone',
        'ipad',
        'ipod',
        'blackberry',
        'windows phone',
        'mobile',
        'webos'
      ];

      const isMobileUserAgent = mobileKeywords.some(keyword =>
        userAgent.includes(keyword)
      );

      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;

      // Combine checks - prioritize screen size but consider other factors
      return isSmallScreen || (isMobileUserAgent && isTouchDevice);
    };

    // Set initial value
    setIsMobile(checkIsMobile());

    // Create media query listener for responsive changes
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = () => {
      setIsMobile(checkIsMobile());
    };

    // Listen for screen size changes
    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('resize', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleChange);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to detect mobile with SSR safety
 * Returns false during SSR, then updates to actual value on client
 */
export function useIsMobileSSR(breakpoint: number = 768): boolean {
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile(breakpoint);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return false during SSR to prevent hydration mismatches
  return isClient ? isMobile : false;
}

/**
 * CSS classes for responsive behavior
 */
export const mobileClasses = {
  showOnMobile: 'block lg:hidden',
  hideOnMobile: 'hidden lg:block',
  mobileFirst: 'lg:hidden',
  desktopFirst: 'hidden lg:block',
} as const;
