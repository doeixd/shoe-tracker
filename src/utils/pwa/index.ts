// PWA Utilities
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
