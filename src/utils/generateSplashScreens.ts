// Utility to generate iOS splash screen configurations
// This helps create the proper splash screens for different iOS devices

export interface SplashScreenConfig {
  device: string;
  width: number;
  height: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  fileName: string;
  mediaQuery: string;
}

export const splashScreenConfigs: SplashScreenConfig[] = [
  // iPhone SE (1st gen, 5s, 5c, 5)
  {
    device: 'iPhone SE',
    width: 320,
    height: 568,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'iphone-se-portrait.png',
    mediaQuery: 'screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPhone SE',
    width: 568,
    height: 320,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'iphone-se-landscape.png',
    mediaQuery: 'screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  },

  // iPhone 6, 6s, 7, 8, SE (2nd gen)
  {
    device: 'iPhone 8',
    width: 375,
    height: 667,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'iphone-8-portrait.png',
    mediaQuery: 'screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPhone 8',
    width: 667,
    height: 375,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'iphone-8-landscape.png',
    mediaQuery: 'screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  },

  // iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus
  {
    device: 'iPhone 8 Plus',
    width: 414,
    height: 736,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-8-plus-portrait.png',
    mediaQuery: 'screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 8 Plus',
    width: 736,
    height: 414,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-8-plus-landscape.png',
    mediaQuery: 'screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone X, XS, 11 Pro
  {
    device: 'iPhone X',
    width: 375,
    height: 812,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-x-portrait.png',
    mediaQuery: 'screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone X',
    width: 812,
    height: 375,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-x-landscape.png',
    mediaQuery: 'screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone XR, 11
  {
    device: 'iPhone XR',
    width: 414,
    height: 896,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'iphone-xr-portrait.png',
    mediaQuery: 'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPhone XR',
    width: 896,
    height: 414,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'iphone-xr-landscape.png',
    mediaQuery: 'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  },

  // iPhone XS Max, 11 Pro Max
  {
    device: 'iPhone XS Max',
    width: 414,
    height: 896,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-xs-max-portrait.png',
    mediaQuery: 'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone XS Max',
    width: 896,
    height: 414,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-xs-max-landscape.png',
    mediaQuery: 'screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone 12, 12 Pro, 13, 13 Pro, 14, 14 Pro
  {
    device: 'iPhone 12',
    width: 390,
    height: 844,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-12-portrait.png',
    mediaQuery: 'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 12',
    width: 844,
    height: 390,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-12-landscape.png',
    mediaQuery: 'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  {
    device: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-12-pro-max-portrait.png',
    mediaQuery: 'screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 12 Pro Max',
    width: 926,
    height: 428,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-12-pro-max-landscape.png',
    mediaQuery: 'screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone 14 Pro
  {
    device: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-14-pro-portrait.png',
    mediaQuery: 'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 14 Pro',
    width: 852,
    height: 393,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-14-pro-landscape.png',
    mediaQuery: 'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone 14 Pro Max
  {
    device: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-14-pro-max-portrait.png',
    mediaQuery: 'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 14 Pro Max',
    width: 932,
    height: 430,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-14-pro-max-landscape.png',
    mediaQuery: 'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone 15, 15 Pro
  {
    device: 'iPhone 15',
    width: 393,
    height: 852,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-15-portrait.png',
    mediaQuery: 'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 15',
    width: 852,
    height: 393,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-15-landscape.png',
    mediaQuery: 'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPhone 15 Plus, 15 Pro Max
  {
    device: 'iPhone 15 Pro Max',
    width: 430,
    height: 932,
    pixelRatio: 3,
    orientation: 'portrait',
    fileName: 'iphone-15-pro-max-portrait.png',
    mediaQuery: 'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)'
  },
  {
    device: 'iPhone 15 Pro Max',
    width: 932,
    height: 430,
    pixelRatio: 3,
    orientation: 'landscape',
    fileName: 'iphone-15-pro-max-landscape.png',
    mediaQuery: 'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)'
  },

  // iPad
  {
    device: 'iPad',
    width: 768,
    height: 1024,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'ipad-portrait.png',
    mediaQuery: 'screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPad',
    width: 1024,
    height: 768,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'ipad-landscape.png',
    mediaQuery: 'screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  },

  // iPad Pro 10.5"
  {
    device: 'iPad Pro 10.5"',
    width: 834,
    height: 1112,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'ipad-pro-10-portrait.png',
    mediaQuery: 'screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPad Pro 10.5"',
    width: 1112,
    height: 834,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'ipad-pro-10-landscape.png',
    mediaQuery: 'screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  },

  // iPad Pro 11"
  {
    device: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'ipad-pro-11-portrait.png',
    mediaQuery: 'screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPad Pro 11"',
    width: 1194,
    height: 834,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'ipad-pro-11-landscape.png',
    mediaQuery: 'screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  },

  // iPad Pro 12.9"
  {
    device: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    orientation: 'portrait',
    fileName: 'ipad-pro-12-portrait.png',
    mediaQuery: 'screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
  },
  {
    device: 'iPad Pro 12.9"',
    width: 1366,
    height: 1024,
    pixelRatio: 2,
    orientation: 'landscape',
    fileName: 'ipad-pro-12-landscape.png',
    mediaQuery: 'screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)'
  }
];

// Generate canvas-based splash screen
export function generateSplashScreen(config: SplashScreenConfig): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Set canvas dimensions (actual pixel dimensions)
  canvas.width = config.width * config.pixelRatio;
  canvas.height = config.height * config.pixelRatio;

  // Create gradient background matching app theme
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#3b82f6'); // Primary blue
  gradient.addColorStop(1, '#1e40af'); // Darker blue

  // Fill background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add app logo/icon in center
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const iconSize = Math.min(canvas.width, canvas.height) * 0.2;

  // Draw app icon placeholder (you'd replace this with actual logo)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.roundRect(
    centerX - iconSize / 2,
    centerY - iconSize / 2,
    iconSize,
    iconSize,
    iconSize * 0.2
  );
  ctx.fill();

  // Add app name below icon
  ctx.fillStyle = 'white';
  ctx.font = `${Math.min(canvas.width, canvas.height) * 0.06}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MyShoeTracker', centerX, centerY + iconSize * 0.8);

  // Add tagline
  ctx.font = `${Math.min(canvas.width, canvas.height) * 0.035}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText('Track Your Runs', centerX, centerY + iconSize * 1.2);

  return canvas.toDataURL('image/png');
}

// Generate all splash screens
export function generateAllSplashScreens(): Record<string, string> {
  const splashScreens: Record<string, string> = {};

  splashScreenConfigs.forEach(config => {
    try {
      splashScreens[config.fileName] = generateSplashScreen(config);
    } catch (error) {
      console.warn(`Failed to generate splash screen for ${config.device}:`, error);
    }
  });

  return splashScreens;
}

// Download splash screen as file (for development)
export function downloadSplashScreen(config: SplashScreenConfig): void {
  try {
    const dataUrl = generateSplashScreen(config);
    const link = document.createElement('a');
    link.download = config.fileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(`Failed to download splash screen for ${config.device}:`, error);
  }
}

// Generate splash screen HTML link tags
export function generateSplashScreenLinks(): string {
  return splashScreenConfigs
    .map(config =>
      `<link rel="apple-touch-startup-image" media="${config.mediaQuery}" href="/splash/${config.fileName}" />`
    )
    .join('\n');
}

// Utility to create responsive splash screen CSS
export function generateSplashScreenCSS(): string {
  return `
/* iOS Splash Screen Styling */
@media (display-mode: standalone) {
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }

  body.splash-loading::before {
    opacity: 1;
  }
}

/* Splash screen loading animation */
.splash-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
}

.splash-container.hidden {
  opacity: 0;
  visibility: hidden;
}

.splash-logo {
  width: 120px;
  height: 120px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: splash-bounce 1.5s ease-in-out infinite;
}

.splash-title {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.splash-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@keyframes splash-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Loading spinner for splash */
.splash-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: splash-spin 1s linear infinite;
  margin-top: 24px;
}

@keyframes splash-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
}
