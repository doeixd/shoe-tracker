import { useEffect, useState } from "react";
import { RefreshCw, Download, X, CheckCircle, AlertCircle } from "lucide-react";

interface ServiceWorkerState {
  isInstalled: boolean;
  isWaiting: boolean;
  isUpdating: boolean;
  error: string | null;
}

export function ServiceWorkerIntegration() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isWaiting: false,
    isUpdating: false,
    error: null,
  });
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwState(prev => ({ ...prev, error: 'Service Worker not supported' }));
      return;
    }

    let refreshing = false;

    const registerSW = async () => {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[SW] Service Worker registered:', registration);

        setSwState(prev => ({ ...prev, isInstalled: true }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log('[SW] New service worker found');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[SW] New content available');
                setSwState(prev => ({ ...prev, isWaiting: true }));
                setShowUpdatePrompt(true);
              }
            }
          });
        });

        // Listen for controlling service worker change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          console.log('[SW] Controller changed, reloading...');
          window.location.reload();
        });

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          setSwState(prev => ({ ...prev, isWaiting: true }));
          setShowUpdatePrompt(true);
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, payload } = event.data;

          switch (type) {
            case 'CACHE_UPDATED':
              console.log('[SW] Cache updated');
              break;
            case 'OFFLINE_READY':
              console.log('[SW] App ready for offline use');
              showNotification('App is ready for offline use', 'success');
              break;
            case 'SYNC_COMPLETED':
              console.log('[SW] Background sync completed');
              showNotification('Data synced successfully', 'success');
              break;
            case 'SYNC_FAILED':
              console.log('[SW] Background sync failed');
              showNotification('Sync failed - will retry when online', 'error');
              break;
            default:
              console.log('[SW] Unknown message:', event.data);
          }
        });

      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error);
        setSwState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Registration failed'
        }));
      }
    };

    registerSW();

    // Cleanup
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      setSwState(prev => ({ ...prev, isUpdating: true }));

      const registration = await navigator.serviceWorker.getRegistration();

      if (registration?.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        setShowUpdatePrompt(false);
      }
    } catch (error) {
      console.error('[SW] Update failed:', error);
      setSwState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Update failed',
        isUpdating: false
      }));
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setSwState(prev => ({ ...prev, isWaiting: false }));
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
      type === 'success'
        ? 'bg-green-50 border border-green-200 text-green-800'
        : 'bg-red-50 border border-red-200 text-red-800'
    }`;

    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="flex-shrink-0">
          ${type === 'success'
            ? '<svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
            : '<svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
          }
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  };

  // Update prompt component
  if (showUpdatePrompt) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 z-50 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Download className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm">App Update Available</div>
              <div className="text-xs text-blue-100">
                A new version of ShoeFit is ready to install
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleUpdate}
              disabled={swState.isUpdating}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors disabled:opacity-50"
            >
              {swState.isUpdating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{swState.isUpdating ? 'Updating...' : 'Update'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="text-blue-100 hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error notification
  if (swState.error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Service Worker Error</h3>
            <p className="text-sm text-red-700 mt-1">{swState.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state (no UI needed, just registered)
  return null;
}

export default ServiceWorkerIntegration;
