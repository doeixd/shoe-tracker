#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Setting up PWA for ShoeFit...\n");

// Directories to create
const directories = ["public/splash", "public/icons", "src/utils/pwa"];

// Create directories
directories.forEach((dir) => {
  const fullPath = path.join(__dirname, "..", dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  } else {
    console.log(`✓ Directory exists: ${dir}`);
  }
});

// Create browserconfig.xml for Windows tiles
const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/android-chrome-192x192.png"/>
            <TileColor>#3b82f6</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;

fs.writeFileSync(
  path.join(__dirname, "..", "public", "browserconfig.xml"),
  browserConfig,
);
console.log("✓ Created browserconfig.xml");

// Create robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`;

fs.writeFileSync(path.join(__dirname, "..", "public", "robots.txt"), robotsTxt);
console.log("✓ Created robots.txt");

// Create PWA utilities
const pwaUtils = `// PWA Utilities
export const PWA_CONFIG = {
  APP_NAME: 'ShoeFit',
  APP_SHORT_NAME: 'ShoeFit',
  APP_DESCRIPTION: 'Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.',
  THEME_COLOR: '#3b82f6',
  BACKGROUND_COLOR: '#ffffff',
  START_URL: '/',
  SCOPE: '/',
  DISPLAY: 'standalone',
  ORIENTATION: 'portrait-primary',
};

// Check if running as PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

// Check if iOS device
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Check if Android device
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android/.test(navigator.userAgent);
}

// Get device type
export function getDeviceType(): 'ios' | 'android' | 'desktop' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  if (window.innerWidth >= 768) return 'desktop';

  return 'unknown';
}

// Check if app is installable
export function isInstallable(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'beforeinstallprompt' in window ||
    (isIOS() && !isPWA())
  );
}

// Get safe area insets
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const computedStyle = getComputedStyle(document.documentElement);

  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

// Vibrate for haptic feedback
export function hapticFeedback(pattern: number | number[] = 10): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.debug('Haptic feedback not available');
  }
}

// Share API
export async function share(data: ShareData): Promise<boolean> {
  if (typeof window === 'undefined' || !('share' in navigator)) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    console.debug('Native sharing not available');
    return false;
  }
}

// Wake lock API
export class WakeLock {
  private wakeLock: WakeLockSentinel | null = null;

  async request(): Promise<boolean> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      return true;
    } catch (error) {
      console.debug('Wake lock not available');
      return false;
    }
  }

  async release(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}

// Battery API
export async function getBatteryInfo() {
  if (typeof window === 'undefined' || !('getBattery' in navigator)) {
    return null;
  }

  try {
    const battery = await (navigator as any).getBattery();
    return {
      charging: battery.charging,
      level: Math.round(battery.level * 100),
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
  } catch (error) {
    console.debug('Battery API not available');
    return null;
  }
}

// Network information
export function getNetworkInfo() {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return null;
  }

  const connection = (navigator as any).connection;

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

// Storage estimate
export async function getStorageEstimate() {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota,
      usage: estimate.usage,
      usageDetails: estimate.usageDetails,
      percentUsed: estimate.quota && estimate.usage
        ? Math.round((estimate.usage / estimate.quota) * 100)
        : 0,
    };
  } catch (error) {
    console.debug('Storage API not available');
    return null;
  }
}

// Persistent storage
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch (error) {
    console.debug('Persistent storage not available');
    return false;
  }
}

// App shortcuts
export function updateAppShortcuts(shortcuts: any[]) {
  if (typeof window === 'undefined' || !('setAppBadge' in navigator)) {
    return;
  }

  // This is a placeholder for future app shortcuts API
  console.debug('App shortcuts:', shortcuts);
}

// Notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

// Show notification
export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      ...options,
    });
  }
}
`;

fs.writeFileSync(
  path.join(__dirname, "..", "src", "utils", "pwa", "index.ts"),
  pwaUtils,
);
console.log("✓ Created PWA utilities");

// Create package.json script additions
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

// Add PWA-related scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "pwa:generate-icons": "bun scripts/generate-icons.js",
  "pwa:generate-splash": "bun scripts/generate-splash-screens.js",
  "pwa:setup": "bun scripts/setup-pwa.js",
  "pwa:check":
    'lighthouse --chrome-flags="--headless" --output=html --output-path=./pwa-audit.html http://localhost:3000',
  "pwa:serve": "bunx serve .output/public -s",
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log("✓ Updated package.json with PWA scripts");

// Create .pwarc configuration
const pwaConfig = {
  name: "ShoeFit",
  shortName: "ShoeFit",
  description:
    "Track your running shoes, monitor mileage, and log your runs with comprehensive analytics and insights.",
  themeColor: "#3b82f6",
  backgroundColor: "#ffffff",
  startUrl: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait-primary",
  categories: ["fitness", "health", "sports", "lifestyle", "productivity"],
  screenshots: [
    {
      src: "/screenshots/desktop-1.png",
      sizes: "1280x800",
      type: "image/png",
      form_factor: "wide",
      label: "ShoeFit Dashboard",
    },
    {
      src: "/screenshots/mobile-1.png",
      sizes: "390x844",
      type: "image/png",
      form_factor: "narrow",
      label: "Mobile Dashboard",
    },
  ],
  features: [
    "offline-support",
    "background-sync",
    "push-notifications",
    "install-prompt",
    "share-target",
    "file-handling",
  ],
  icons: {
    generateSizes: [16, 32, 72, 96, 128, 144, 152, 192, 384, 512],
    inputIcon: "src/assets/icon.svg",
    outputDir: "public/",
  },
  splashScreens: {
    generateAll: true,
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
    outputDir: "public/splash/",
  },
};

fs.writeFileSync(
  path.join(__dirname, "..", ".pwarc"),
  JSON.stringify(pwaConfig, null, 2),
);
console.log("✓ Created .pwarc configuration");

// Create GitHub workflow for PWA testing
const githubWorkflowDir = path.join(__dirname, "..", ".github", "workflows");
if (!fs.existsSync(githubWorkflowDir)) {
  fs.mkdirSync(githubWorkflowDir, { recursive: true });
}

const pwaWorkflow = `name: PWA Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  pwa-audit:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install

    - name: Build app
      run: bun run build

    - name: Install Lighthouse CI
      run: bun add -g @lhci/cli

    - name: Run Lighthouse CI
      run: |
        bun run pwa:serve &
        sleep 10
        lhci autorun --upload.target=temporary-public-storage
      env:
        LHCI_GITHUB_APP_TOKEN: \${{ secrets.LHCI_GITHUB_APP_TOKEN }}

    - name: Upload PWA audit results
      uses: actions/upload-artifact@v3
      with:
        name: pwa-audit-results
        path: .lighthouseci/
`;

fs.writeFileSync(path.join(githubWorkflowDir, "pwa-audit.yml"), pwaWorkflow);
console.log("✓ Created GitHub workflow for PWA testing");

// Create lighthouse configuration
const lighthouseConfig = {
  ci: {
    collect: {
      url: ["http://localhost:3000"],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "categories:pwa": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};

fs.writeFileSync(
  path.join(__dirname, "..", "lighthouserc.json"),
  JSON.stringify(lighthouseConfig, null, 2),
);
console.log("✓ Created Lighthouse configuration");

// Create PWA checklist
const pwaChecklist = `# PWA Setup Checklist for ShoeFit

## ✅ Core PWA Requirements
- [x] Web App Manifest
- [x] Service Worker
- [x] HTTPS (required for production)
- [x] Responsive Design
- [x] App Shell Architecture

## ✅ iOS Optimizations
- [x] Apple Touch Icon
- [x] Apple Meta Tags
- [x] iOS Splash Screens
- [x] Safe Area Support
- [x] iOS Input Zoom Prevention
- [x] iOS Scroll Behavior Fixes
- [x] Haptic Feedback Support

## ✅ Android Optimizations
- [x] Chrome Theme Color
- [x] Android Chrome Icons
- [x] Maskable Icons
- [x] Android Splash Screens

## ✅ Enhanced Features
- [x] Offline Support
- [x] Background Sync
- [x] Install Prompts
- [x] Update Notifications
- [x] Share Target API
- [x] File Handler API

## 🔄 Performance Optimizations
- [x] Critical Resource Preloading
- [x] Efficient Caching Strategy
- [x] Code Splitting
- [x] Image Optimization
- [x] CSS/JS Minification

## 📱 Mobile UX
- [x] Touch-Friendly UI (44px minimum)
- [x] Swipe Gestures
- [x] Pull-to-Refresh
- [x] Loading States
- [x] Error Handling

## 🔧 Development Tools
- [x] PWA Testing Workflow
- [x] Lighthouse Auditing
- [x] Service Worker DevTools
- [x] Manifest Validation

## 🚀 Deployment Checklist
- [ ] HTTPS Certificate
- [ ] CDN Configuration
- [ ] Cache Headers
- [ ] Service Worker Registration
- [ ] Manifest Validation
- [ ] Icon Generation
- [ ] Splash Screen Generation

## 📊 Testing
- [ ] Lighthouse PWA Score > 90
- [ ] Cross-browser Testing
- [ ] iOS Safari Testing
- [ ] Android Chrome Testing
- [ ] Offline Functionality
- [ ] Install Flow Testing

## 🔍 Monitoring
- [ ] Analytics Integration
- [ ] Error Tracking
- [ ] Performance Monitoring
- [ ] User Engagement Metrics

## 📝 Next Steps
1. Run \`pnpm pwa:generate-splash\` to create splash screens
2. Run \`pnpm pwa:check\` to audit PWA compliance
3. Test on real iOS/Android devices
4. Deploy to HTTPS-enabled hosting
5. Submit to app stores (optional)

## 🛠️ Commands
- \`pnpm pwa:setup\` - Run this setup script
- \`pnpm pwa:generate-splash\` - Generate iOS splash screens
- \`pnpm pwa:generate-icons\` - Generate app icons
- \`pnpm pwa:check\` - Run Lighthouse PWA audit
- \`pnpm pwa:serve\` - Serve built app for testing

## 📚 Resources
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [iOS PWA Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Android PWA Guide](https://developers.google.com/web/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox/)
`;

fs.writeFileSync(path.join(__dirname, "..", "PWA_CHECKLIST.md"), pwaChecklist);
console.log("✓ Created PWA checklist");

console.log("\n🎉 PWA setup complete!");
console.log("\n📋 Next steps:");
console.log(
  "1. Run `bun scripts/generate-splash-screens.js` to create splash screens",
);
console.log("2. Test your PWA with `bun run pwa:check`");
console.log("3. Deploy to HTTPS for full PWA functionality");
console.log("4. Check PWA_CHECKLIST.md for detailed testing steps");
console.log("\n🔗 Your app is now optimized for:");
console.log("   ✓ iOS Safari PWA installation");
console.log("   ✓ Android Chrome PWA features");
console.log("   ✓ Offline functionality");
console.log("   ✓ Native app-like experience");
console.log("\n🚀 Happy building!");
