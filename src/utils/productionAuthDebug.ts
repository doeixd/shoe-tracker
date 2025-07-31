// Production Authentication Debug Helper
// Accessible via browser console: window.productionAuthDebug

interface ProductionAuthLog {
  timestamp: number;
  level: string;
  event: string;
  data?: any;
  url: string;
}

interface ProductionAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  error: string | null;
  environment: string;
  timestamp: string;
}

class ProductionAuthDebugger {
  private static instance: ProductionAuthDebugger;
  private logs: ProductionAuthLog[] = [];
  private isEnabled = true;

  static getInstance(): ProductionAuthDebugger {
    if (!ProductionAuthDebugger.instance) {
      ProductionAuthDebugger.instance = new ProductionAuthDebugger();
    }
    return ProductionAuthDebugger.instance;
  }

  constructor() {
    this.initializeDebugger();
  }

  private initializeDebugger() {
    console.log("🔧 Production Auth Debugger initialized");
    console.log("Available commands:");
    console.log(
      "- window.productionAuthDebug.getState() - Get current auth state",
    );
    console.log("- window.productionAuthDebug.getLogs() - Get auth logs");
    console.log("- window.productionAuthDebug.testAuth() - Test auth flow");
    console.log(
      "- window.productionAuthDebug.exportLogs() - Export debug data",
    );
    console.log("- window.productionAuthDebug.clearLogs() - Clear logs");
    console.log("- window.productionAuthDebug.help() - Show this help");
  }

  log(level: string, event: string, data?: any) {
    if (!this.isEnabled) return;

    const logEntry: ProductionAuthLog = {
      timestamp: Date.now(),
      level,
      event,
      data,
      url: window.location.href,
    };

    this.logs.push(logEntry);

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Also store in localStorage for persistence
    try {
      localStorage.setItem("prod-auth-debug-logs", JSON.stringify(this.logs));
    } catch (e) {
      console.warn("Could not save logs to localStorage:", e);
    }

    // Console output with colors
    const colors = {
      debug: "color: #6B7280;",
      info: "color: #2563EB;",
      warn: "color: #F59E0B;",
      error: "color: #DC2626;",
    };

    const style = colors[level as keyof typeof colors] || colors.info;
    console.log(
      `%c[PROD-AUTH-DEBUG] ${level.toUpperCase()}: ${event}`,
      style,
      data ? data : "",
    );
  }

  getState(): ProductionAuthState | null {
    try {
      // Try to get state from global auth context
      const authDebug = (window as any).authDebug;
      if (authDebug && typeof authDebug.getCurrentState === "function") {
        return authDebug.getCurrentState();
      }

      // Fallback: try to get from React DevTools or other sources
      return null;
    } catch (error) {
      this.log("error", "failed_to_get_auth_state", { error: error.message });
      return null;
    }
  }

  getLogs(): ProductionAuthLog[] {
    // Combine in-memory logs with localStorage logs
    try {
      const storedLogs = JSON.parse(
        localStorage.getItem("prod-auth-debug-logs") || "[]",
      );
      const allLogs = [...storedLogs, ...this.logs];

      // Remove duplicates based on timestamp
      const uniqueLogs = allLogs.filter(
        (log, index, self) =>
          index === self.findIndex((l) => l.timestamp === log.timestamp),
      );

      return uniqueLogs.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      this.log("error", "failed_to_get_logs", { error: error.message });
      return this.logs;
    }
  }

  getSystemInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      url: window.location.href,
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localStorage: typeof Storage !== "undefined",
      sessionStorage: typeof sessionStorage !== "undefined",
      convexUrl: (window as any).__CONVEX_URL__ || "not detected",
      environment: import.meta.env?.PROD ? "production" : "development",
    };
  }

  async testAuth() {
    this.log("info", "starting_auth_test");

    try {
      // Test 1: Check current auth state
      const currentState = this.getState();
      this.log("info", "current_auth_state", currentState);

      // Test 2: Check if auth provider is accessible
      const authDebug = (window as any).authDebug;
      if (authDebug) {
        this.log("info", "auth_provider_accessible", {
          hasTestSignIn: typeof authDebug.testSignIn === "function",
          hasTestSignOut: typeof authDebug.testSignOut === "function",
          hasGetLogs: typeof authDebug.getLogs === "function",
        });
      } else {
        this.log("warn", "auth_provider_not_accessible");
      }

      // Test 3: Check localStorage auth data
      const authLogs = localStorage.getItem("auth-debug-logs");
      if (authLogs) {
        try {
          const logs = JSON.parse(authLogs);
          this.log("info", "localStorage_auth_logs_found", {
            count: logs.length,
            latest: logs[logs.length - 1],
          });
        } catch (e) {
          this.log("warn", "localStorage_auth_logs_corrupted");
        }
      } else {
        this.log("info", "no_localStorage_auth_logs");
      }

      // Test 4: Network connectivity
      try {
        const startTime = Date.now();
        const response = await fetch("https://httpbin.org/get", {
          method: "GET",
          timeout: 5000,
        });
        const duration = Date.now() - startTime;
        this.log("info", "network_connectivity_test", {
          success: response.ok,
          status: response.status,
          duration,
        });
      } catch (error) {
        this.log("warn", "network_connectivity_failed", {
          error: error.message,
        });
      }

      // Test 5: Check if Convex is accessible
      const convexUrl = import.meta.env?.VITE_CONVEX_URL;
      if (convexUrl) {
        try {
          const startTime = Date.now();
          const response = await fetch(
            convexUrl.replace(/\/$/, "") + "/api/ping",
            {
              method: "GET",
              timeout: 10000,
            },
          );
          const duration = Date.now() - startTime;
          this.log("info", "convex_connectivity_test", {
            success: response.ok,
            status: response.status,
            duration,
            url: convexUrl,
          });
        } catch (error) {
          this.log("error", "convex_connectivity_failed", {
            error: error.message,
            url: convexUrl,
          });
        }
      } else {
        this.log("warn", "convex_url_not_configured");
      }

      this.log("info", "auth_test_completed");
      return {
        success: true,
        logs: this.getLogs().slice(-10), // Last 10 logs
        state: currentState,
        systemInfo: this.getSystemInfo(),
      };
    } catch (error) {
      this.log("error", "auth_test_failed", { error: error.message });
      return {
        success: false,
        error: error.message,
        logs: this.getLogs().slice(-10),
      };
    }
  }

  async triggerSignIn() {
    this.log("info", "triggering_sign_in");
    try {
      const authDebug = (window as any).authDebug;
      if (authDebug && typeof authDebug.testSignIn === "function") {
        await authDebug.testSignIn();
        this.log("info", "sign_in_triggered");
      } else {
        this.log("error", "sign_in_not_available");
      }
    } catch (error) {
      this.log("error", "sign_in_failed", { error: error.message });
    }
  }

  async triggerSignOut() {
    this.log("info", "triggering_sign_out");
    try {
      const authDebug = (window as any).authDebug;
      if (authDebug && typeof authDebug.testSignOut === "function") {
        await authDebug.testSignOut();
        this.log("info", "sign_out_triggered");
      } else {
        this.log("error", "sign_out_not_available");
      }
    } catch (error) {
      this.log("error", "sign_out_failed", { error: error.message });
    }
  }

  exportLogs() {
    try {
      const exportData = {
        logs: this.getLogs(),
        state: this.getState(),
        systemInfo: this.getSystemInfo(),
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `prod-auth-debug-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.log("info", "debug_data_exported");
      console.log("📁 Debug data exported to file");
    } catch (error) {
      this.log("error", "export_failed", { error: error.message });
    }
  }

  copyToClipboard() {
    try {
      const exportData = {
        logs: this.getLogs().slice(-20), // Last 20 logs
        state: this.getState(),
        systemInfo: this.getSystemInfo(),
        timestamp: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      navigator.clipboard.writeText(dataStr).then(() => {
        this.log("info", "debug_data_copied_to_clipboard");
        console.log("📋 Debug data copied to clipboard");
      });
    } catch (error) {
      this.log("error", "copy_to_clipboard_failed", { error: error.message });
    }
  }

  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem("prod-auth-debug-logs");
      localStorage.removeItem("auth-debug-logs");
      this.log("info", "logs_cleared");
      console.log("🗑️ All logs cleared");
    } catch (error) {
      this.log("error", "clear_logs_failed", { error: error.message });
    }
  }

  enable() {
    this.isEnabled = true;
    this.log("info", "debugger_enabled");
    console.log("✅ Production auth debugger enabled");
  }

  disable() {
    this.isEnabled = false;
    console.log("❌ Production auth debugger disabled");
  }

  help() {
    console.log(`
🔧 Production Auth Debugger Commands:

Basic Commands:
- window.productionAuthDebug.getState() - Get current authentication state
- window.productionAuthDebug.getLogs() - Get all authentication logs
- window.productionAuthDebug.testAuth() - Run comprehensive auth tests
- window.productionAuthDebug.getSystemInfo() - Get system information

Auth Actions:
- window.productionAuthDebug.triggerSignIn() - Trigger sign-in flow
- window.productionAuthDebug.triggerSignOut() - Trigger sign-out flow

Export/Import:
- window.productionAuthDebug.exportLogs() - Download debug data as JSON
- window.productionAuthDebug.copyToClipboard() - Copy debug data to clipboard

Utilities:
- window.productionAuthDebug.clearLogs() - Clear all logs
- window.productionAuthDebug.enable() - Enable debug logging
- window.productionAuthDebug.disable() - Disable debug logging
- window.productionAuthDebug.help() - Show this help message

Example Usage:
1. Check if user is authenticated: window.productionAuthDebug.getState()
2. See recent auth events: window.productionAuthDebug.getLogs().slice(-5)
3. Test the full auth flow: window.productionAuthDebug.testAuth()
4. Export data for support: window.productionAuthDebug.exportLogs()
    `);
  }
}

// Initialize and expose globally
if (typeof window !== "undefined") {
  const authDebugger = ProductionAuthDebugger.getInstance();
  (window as any).productionAuthDebug = authDebugger;

  // Also expose shorter alias
  (window as any).authDbg = authDebugger;

  // Auto-log page loads
  authDebugger.log("info", "page_loaded", {
    url: window.location.href,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  });

  // Log navigation events
  window.addEventListener("beforeunload", () => {
    authDebugger.log("info", "page_unloading", {
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  });

  // Log auth-related errors that bubble up
  window.addEventListener("error", (event) => {
    if (
      event.error?.message?.toLowerCase().includes("auth") ||
      event.error?.message?.toLowerCase().includes("sign") ||
      event.error?.message?.toLowerCase().includes("token")
    ) {
      authDebugger.log("error", "auth_related_js_error", {
        message: event.error.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error.stack?.slice(0, 500),
      });
    }
  });

  // Log unhandled promise rejections that might be auth-related
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.toLowerCase().includes("auth") ||
      event.reason?.message?.toLowerCase().includes("sign") ||
      event.reason?.message?.toLowerCase().includes("token")
    ) {
      authDebugger.log("error", "auth_related_promise_rejection", {
        message: event.reason.message,
        stack: event.reason.stack?.slice(0, 500),
      });
    }
  });

  console.log(
    "🚀 Production Auth Debugger loaded! Type 'window.productionAuthDebug.help()' for commands.",
  );
}

export default ProductionAuthDebugger;
