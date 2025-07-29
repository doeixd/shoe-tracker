// Browser Console Auth Test Helper
// Copy and paste this code into your browser console to test auth functionality
// Works in both development and production environments

(function() {
  console.log("🔧 Loading Browser Auth Test Helper...");

  // Test configuration
  const TEST_CONFIG = {
    name: "Browser Auth Test",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  };

  // Utility functions
  function log(message, level = 'info', data = null) {
    const prefix = "🧪 [AUTH-TEST]";
    const styles = {
      info: "color: #2563EB; font-weight: bold;",
      success: "color: #059669; font-weight: bold;",
      error: "color: #DC2626; font-weight: bold;",
      warn: "color: #D97706; font-weight: bold;"
    };

    console.log(`%c${prefix} ${message}`, styles[level] || styles.info, data || '');
  }

  function getEnvironmentInfo() {
    return {
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      localStorage: typeof Storage !== "undefined",
      timestamp: new Date().toISOString(),
      convexUrl: window.__CONVEX_URL__ || "not detected",
      environment: window.location.hostname.includes('localhost') ? 'development' : 'production'
    };
  }

  function checkAuthProvider() {
    log("Checking Auth Provider Availability...");

    const authDebug = window.authDebug;
    if (authDebug) {
      log("✅ Auth provider found!", 'success');

      const state = authDebug.getCurrentState ? authDebug.getCurrentState() : null;
      if (state) {
        log("Current Auth State:", 'info', state);
        return { available: true, state };
      } else {
        log("⚠️ Auth provider found but state unavailable", 'warn');
        return { available: true, state: null };
      }
    } else {
      log("❌ Auth provider not found", 'error');
      log("This might mean the AuthProvider hasn't loaded yet or there's an error", 'warn');
      return { available: false, state: null };
    }
  }

  function checkLocalStorageAuth() {
    log("Checking localStorage for auth data...");

    try {
      const authLogs = localStorage.getItem('auth-debug-logs');
      const prodLogs = localStorage.getItem('prod-auth-debug-logs');

      let authData = null;
      let prodData = null;

      if (authLogs) {
        authData = JSON.parse(authLogs);
        log(`✅ Found ${authData.length} auth debug logs`, 'success');
      }

      if (prodLogs) {
        prodData = JSON.parse(prodLogs);
        log(`✅ Found ${prodData.length} production auth logs`, 'success');
      }

      if (!authLogs && !prodLogs) {
        log("ℹ️ No auth logs found in localStorage", 'info');
      }

      return { authLogs: authData, prodLogs: prodData };
    } catch (error) {
      log("❌ Error reading localStorage auth data", 'error', error.message);
      return null;
    }
  }

  async function testNetworkConnectivity() {
    log("Testing network connectivity...");

    const tests = [
      {
        name: "Basic Network",
        url: "https://httpbin.org/get",
        timeout: 5000
      },
      {
        name: "Google OAuth",
        url: "https://accounts.google.com/.well-known/openid-configuration",
        timeout: 10000
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await fetch(test.url, {
          method: 'GET',
          timeout: test.timeout
        });
        const duration = Date.now() - startTime;

        if (response.ok) {
          log(`✅ ${test.name} connectivity: OK (${duration}ms)`, 'success');
          results.push({ name: test.name, success: true, duration, status: response.status });
        } else {
          log(`❌ ${test.name} connectivity: FAILED (${response.status})`, 'error');
          results.push({ name: test.name, success: false, duration, status: response.status });
        }
      } catch (error) {
        log(`❌ ${test.name} connectivity: ERROR`, 'error', error.message);
        results.push({ name: test.name, success: false, error: error.message });
      }
    }

    return results;
  }

  async function testConvexConnectivity() {
    log("Testing Convex connectivity...");

    // Try to detect Convex URL from various sources
    const convexUrl =
      window.__CONVEX_URL__ ||
      document.querySelector('meta[name="convex-url"]')?.content ||
      (window._env_ && window._env_.VITE_CONVEX_URL) ||
      null;

    if (!convexUrl) {
      log("❌ Convex URL not found", 'error');
      log("Check that VITE_CONVEX_URL is configured", 'warn');
      return { success: false, error: "URL not found" };
    }

    log(`Testing Convex URL: ${convexUrl}`);

    try {
      const startTime = Date.now();
      const response = await fetch(convexUrl.replace(/\/$/, '') + '/api/ping', {
        method: 'GET',
        timeout: 10000
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        log(`✅ Convex connectivity: OK (${duration}ms)`, 'success');
        return { success: true, duration, url: convexUrl };
      } else {
        log(`❌ Convex connectivity: FAILED (${response.status})`, 'error');
        return { success: false, status: response.status, url: convexUrl };
      }
    } catch (error) {
      log(`❌ Convex connectivity: ERROR`, 'error', error.message);
      return { success: false, error: error.message, url: convexUrl };
    }
  }

  function testAuthFlow() {
    log("Testing auth flow actions...");

    const authDebug = window.authDebug;
    if (!authDebug) {
      log("❌ Cannot test auth flow - provider not available", 'error');
      return false;
    }

    const actions = {
      hasTestSignIn: typeof authDebug.testSignIn === 'function',
      hasTestSignOut: typeof authDebug.testSignOut === 'function',
      hasGetLogs: typeof authDebug.getLogs === 'function',
      hasGetCurrentState: typeof authDebug.getCurrentState === 'function'
    };

    log("Available auth actions:", 'info', actions);

    if (actions.hasTestSignIn) {
      log("✅ Sign-in test function available", 'success');
      log("Run: window.authDebug.testSignIn() to test sign-in", 'info');
    }

    if (actions.hasTestSignOut) {
      log("✅ Sign-out test function available", 'success');
      log("Run: window.authDebug.testSignOut() to test sign-out", 'info');
    }

    return actions;
  }

  function checkPageSpecificAuth() {
    log("Checking page-specific auth requirements...");

    const currentPath = window.location.pathname;
    const protectedPaths = ['/collections', '/shoes', '/runs', '/profile'];
    const authPaths = ['/auth/signin'];
    const publicPaths = ['/debug-dashboard'];

    if (protectedPaths.some(path => currentPath.startsWith(path))) {
      log(`📄 Current page (${currentPath}) requires authentication`, 'warn');
    } else if (authPaths.some(path => currentPath.startsWith(path))) {
      log(`📄 Current page (${currentPath}) is an auth page`, 'info');
    } else if (publicPaths.some(path => currentPath.startsWith(path))) {
      log(`📄 Current page (${currentPath}) is public`, 'info');
    } else {
      log(`📄 Current page (${currentPath}) auth requirements unknown`, 'warn');
    }
  }

  function generateRecommendations(results) {
    log("Generating recommendations...");

    const recommendations = [];

    if (!results.authProvider.available) {
      recommendations.push("🔧 Auth provider not loaded - check for JavaScript errors in console");
    }

    if (!results.networkTests.every(test => test.success)) {
      recommendations.push("🌐 Network connectivity issues detected - check internet connection");
    }

    if (!results.convexTest.success) {
      recommendations.push("🔧 Convex connectivity failed - check VITE_CONVEX_URL configuration");
    }

    if (results.authProvider.available && results.authProvider.state && !results.authProvider.state.isAuthenticated) {
      recommendations.push("🔑 User not authenticated - try signing in");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ No issues detected - auth system appears healthy");
    }

    recommendations.forEach(rec => log(rec, 'info'));
    return recommendations;
  }

  // Main test function
  async function runAuthTest() {
    log("🚀 Starting Browser Auth Test...", 'info');
    log(`Environment: ${getEnvironmentInfo().environment}`, 'info');

    const results = {
      timestamp: new Date().toISOString(),
      environment: getEnvironmentInfo(),
      authProvider: checkAuthProvider(),
      localStorage: checkLocalStorageAuth(),
      networkTests: await testNetworkConnectivity(),
      convexTest: await testConvexConnectivity(),
      authFlow: testAuthFlow()
    };

    checkPageSpecificAuth();

    const recommendations = generateRecommendations(results);

    log("📊 Test Complete! Results:", 'success', results);

    // Store results globally for inspection
    window.authTestResults = results;
    log("💾 Results saved to window.authTestResults", 'info');

    return results;
  }

  // Helper functions for manual testing
  function quickSignIn() {
    log("🔑 Attempting quick sign-in...");
    if (window.authDebug && window.authDebug.testSignIn) {
      window.authDebug.testSignIn();
    } else {
      log("❌ Sign-in function not available", 'error');
    }
  }

  function quickSignOut() {
    log("🚪 Attempting quick sign-out...");
    if (window.authDebug && window.authDebug.testSignOut) {
      window.authDebug.testSignOut();
    } else {
      log("❌ Sign-out function not available", 'error');
    }
  }

  function showAuthState() {
    log("📊 Current Auth State:");
    if (window.authDebug && window.authDebug.getCurrentState) {
      const state = window.authDebug.getCurrentState();
      console.table(state);
    } else {
      log("❌ Auth state not available", 'error');
    }
  }

  function exportAuthData() {
    log("📁 Exporting auth data...");
    const data = {
      testResults: window.authTestResults,
      authLogs: window.authDebug?.getLogs?.() || [],
      localStorage: checkLocalStorageAuth(),
      environment: getEnvironmentInfo(),
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    console.log("Auth Data Export:", dataStr);

    // Try to copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dataStr).then(() => {
        log("📋 Auth data copied to clipboard!", 'success');
      }).catch(() => {
        log("⚠️ Could not copy to clipboard, check console output", 'warn');
      });
    }
  }

  // Expose functions globally
  window.browserAuthTest = {
    run: runAuthTest,
    signIn: quickSignIn,
    signOut: quickSignOut,
    showState: showAuthState,
    export: exportAuthData,
    help: function() {
      console.log(`
🔧 Browser Auth Test Helper Commands:

Main Functions:
- browserAuthTest.run() - Run complete auth diagnostic
- browserAuthTest.showState() - Show current auth state
- browserAuthTest.signIn() - Quick sign-in test
- browserAuthTest.signOut() - Quick sign-out test
- browserAuthTest.export() - Export all auth data

Direct Access:
- window.authDebug - Direct auth provider access
- window.authTestResults - Last test results
- window.productionAuthDebug - Production debugger (if available)

Example Usage:
1. Run full test: browserAuthTest.run()
2. Check auth state: browserAuthTest.showState()
3. Export data: browserAuthTest.export()
      `);
    }
  };

  log("✅ Browser Auth Test Helper loaded!", 'success');
  log("Type 'browserAuthTest.help()' for available commands", 'info');
  log("Type 'browserAuthTest.run()' to start testing", 'info');

})();
