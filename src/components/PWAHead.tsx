import { useEffect } from "react";

export function PWAHead() {
  useEffect(() => {
    const head = document.head;
    const metaTags: HTMLMetaElement[] = [];

    // Helper function to create and add meta tags
    const addMetaTag = (attributes: Record<string, string>) => {
      const meta = document.createElement("meta");
      Object.entries(attributes).forEach(([key, value]) => {
        meta.setAttribute(key, value);
      });
      head.appendChild(meta);
      metaTags.push(meta);
    };

    // Standard Meta Tags
    addMetaTag({ charset: "utf-8" });
    addMetaTag({
      name: "viewport",
      content:
        "width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no",
    });
    addMetaTag({
      name: "description",
      content:
        "Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.",
    });
    addMetaTag({
      name: "keywords",
      content:
        "running, shoes, tracker, fitness, health, marathon, training, analytics",
    });
    addMetaTag({ name: "author", content: "ShoeFit" });
    addMetaTag({ name: "robots", content: "index, follow" });

    // PWA Meta Tags
    addMetaTag({ name: "application-name", content: "ShoeFit" });
    addMetaTag({ name: "theme-color", content: "#3b82f6" });
    addMetaTag({ name: "color-scheme", content: "light dark" });
    addMetaTag({ name: "supported-color-schemes", content: "light dark" });

    // iOS Specific Meta Tags
    addMetaTag({ name: "apple-mobile-web-app-capable", content: "yes" });
    addMetaTag({
      name: "apple-mobile-web-app-status-bar-style",
      content: "default",
    });
    addMetaTag({ name: "apple-mobile-web-app-title", content: "ShoeFit" });
    addMetaTag({ name: "apple-touch-fullscreen", content: "yes" });
    addMetaTag({ name: "format-detection", content: "telephone=no" });

    // Windows/Microsoft
    addMetaTag({ name: "msapplication-TileColor", content: "#3b82f6" });
    addMetaTag({ name: "msapplication-config", content: "/browserconfig.xml" });
    addMetaTag({ name: "msapplication-tap-highlight", content: "no" });

    // Android/Chrome
    addMetaTag({ name: "mobile-web-app-capable", content: "yes" });
    addMetaTag({
      name: "mobile-web-app-status-bar-style",
      content: "black-translucent",
    });

    // Disable automatic detection
    addMetaTag({
      name: "format-detection",
      content: "telephone=no, date=no, address=no, email=no, url=no",
    });

    // Open Graph / Social Media
    addMetaTag({ property: "og:type", content: "website" });
    addMetaTag({ property: "og:site_name", content: "ShoeFit" });
    addMetaTag({
      property: "og:title",
      content: "ShoeFit - Running Shoe Tracker",
    });
    addMetaTag({
      property: "og:description",
      content:
        "Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.",
    });
    addMetaTag({ property: "og:image", content: "/og-image.png" });
    addMetaTag({ property: "og:image:width", content: "1200" });
    addMetaTag({ property: "og:image:height", content: "630" });
    addMetaTag({
      property: "og:image:alt",
      content: "ShoeFit - Running Shoe Tracker",
    });
    addMetaTag({ property: "og:locale", content: "en_US" });

    // Twitter Card
    addMetaTag({ name: "twitter:card", content: "summary_large_image" });
    addMetaTag({ name: "twitter:site", content: "@shoefit" });
    addMetaTag({ name: "twitter:creator", content: "@shoefit" });
    addMetaTag({
      name: "twitter:title",
      content: "ShoeFit - Running Shoe Tracker",
    });
    addMetaTag({
      name: "twitter:description",
      content:
        "Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.",
    });
    addMetaTag({ name: "twitter:image", content: "/twitter-card.png" });

    // CSP and Security
    addMetaTag({ httpEquiv: "X-Content-Type-Options", content: "nosniff" });
    addMetaTag({ httpEquiv: "X-Frame-Options", content: "DENY" });
    addMetaTag({ httpEquiv: "X-XSS-Protection", content: "1; mode=block" });
    addMetaTag({
      httpEquiv: "Referrer-Policy",
      content: "strict-origin-when-cross-origin",
    });

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      metaTags.forEach((tag) => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
    };
  }, []);

  return (
    <>
      {/* Links that can stay as JSX */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="dns-prefetch" href="https://api.convex.cloud" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />

      {/* iOS Splash Screens */}
      {/* iPhone X, XS, 11 Pro */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        href="/splash/iphone-x-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        href="/splash/iphone-x-landscape.png"
      />

      {/* iPhone XR, 11 */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        href="/splash/iphone-xr-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        href="/splash/iphone-xr-landscape.png"
      />

      {/* iPhone XS Max, 11 Pro Max */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        href="/splash/iphone-xs-max-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        href="/splash/iphone-xs-max-landscape.png"
      />

      {/* iPhone 12, 13, 14 */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        href="/splash/iphone-12-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        href="/splash/iphone-12-landscape.png"
      />

      {/* iPhone 12 Pro Max, 13 Pro Max, 14 Plus */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        href="/splash/iphone-12-pro-max-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        href="/splash/iphone-12-pro-max-landscape.png"
      />

      {/* iPhone 14 Pro */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        href="/splash/iphone-14-pro-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        href="/splash/iphone-14-pro-landscape.png"
      />

      {/* iPhone 14 Pro Max */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        href="/splash/iphone-14-pro-max-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
        href="/splash/iphone-14-pro-max-landscape.png"
      />

      {/* iPad */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        href="/splash/ipad-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        href="/splash/ipad-landscape.png"
      />

      {/* iPad Pro 11" */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        href="/splash/ipad-pro-11-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        href="/splash/ipad-pro-11-landscape.png"
      />

      {/* iPad Pro 12.9" */}
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        href="/splash/ipad-pro-12-portrait.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
        href="/splash/ipad-pro-12-landscape.png"
      />
      {/* Performance and Optimization */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link rel="modulepreload" href="/src/main.tsx" />

      {/* Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            name: "ShoeFit",
            description:
              "Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.",
            applicationCategory: "HealthApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1000",
            },
          }),
        }}
      />
    </>
  );
}

export default PWAHead;
