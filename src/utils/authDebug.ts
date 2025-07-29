// Auth debugging utilities for comprehensive authentication diagnostics
import { QueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";

export interface AuthEnvironmentInfo {
  environment: "development" | "production" | "unknown";
  convexUrl: string | null;
  domain: string;
  protocol: string;
  userAgent: string;
  timestamp: string;
  timezone: string;
  language: string;
}

export interface AuthConnectivityTest {
  name: string;
  status: "success" | "error" | "pending";
  duration?: number;
  error?: string;
  details?: any;
}

export interface AuthFlowStep {
  step: string;
  status: "pending" | "success" | "error" | "skipped";
  timestamp: number;
  duration?: number;
  error?: string;
  data?: any;
}

export interface AuthDiagnosticResult {
  overall: "healthy" | "warning" | "error";
  environment: AuthEnvironmentInfo;
  connectivity: AuthConnectivityTest[];
  authFlow: AuthFlowStep[];
  configuration: {
    hasConvexUrl: boolean;
    convexUrlFormat: "valid" | "invalid" | "missing";
    googleAuthConfigured: boolean;
    environmentVariables: Record<string, "set" | "missing" | "invalid">;
  };
  recommendations: string[];
  debugData: any;
}

// Get current environment information
export function getAuthEnvironmentInfo(): AuthEnvironmentInfo {
  const now = new Date();

  return {
    environment: import.meta.env.PROD
      ? "production"
      : import.meta.env.DEV
        ? "development"
        : "unknown",
    convexUrl: import.meta.env.VITE_CONVEX_URL || null,
    domain: typeof window !== "undefined" ? window.location.hostname : "unknown",
    protocol: typeof window !== "undefined" ? window.location.protocol : "unknown",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: typeof navigator !== "undefined" ? navigator.language : "unknown",
  };
}

// Test connectivity to various endpoints
export async function runConnectivityTests(): Promise<AuthConnectivityTest[]> {
  const tests: AuthConnectivityTest[] = [];

  // Test 1: Convex URL accessibility
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (convexUrl) {
    const convexTest: AuthConnectivityTest = {
      name: "Convex URL Connectivity",
      status: "pending",
    };

    try {
      const startTime = Date.now();
      const response = await fetch(convexUrl.replace(/\/$/, "") + "/api/ping", {
        method: "GET",
        timeout: 10000,
      });
      convexTest.duration = Date.now() - startTime;

      if (response.ok) {
        convexTest.status = "success";
        convexTest.details = { status: response.status };
      } else {
        convexTest.status = "error";
        convexTest.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error: any) {
      convexTest.status = "error";
      convexTest.error = error.message || "Connection failed";
      convexTest.duration = Date.now() - Date.now();
    }

    tests.push(convexTest);
  } else {
    tests.push({
      name: "Convex URL Connectivity",
      status: "error",
      error: "VITE_CONVEX_URL not configured",
    });
  }

  // Test 2: Google OAuth endpoints
  const googleTest: AuthConnectivityTest = {
    name: "Google OAuth Connectivity",
    status: "pending",
  };

  try {
    const startTime = Date.now();
    const response = await fetch("https://accounts.google.com/.well-known/openid-configuration", {
      method: "GET",
      timeout: 10000,
    });
    googleTest.duration = Date.now() - startTime;

    if (response.ok) {
      googleTest.status = "success";
      const config = await response.json();
      googleTest.details = {
        authorization_endpoint: config.authorization_endpoint,
        token_endpoint: config.token_endpoint,
      };
    } else {
      googleTest.status = "error";
      googleTest.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error: any) {
    googleTest.status = "error";
    googleTest.error = error.message || "Connection failed";
  }

  tests.push(googleTest);

  // Test 3: Basic network connectivity
  const networkTest: AuthConnectivityTest = {
    name: "Basic Network Connectivity",
    status: "pending",
  };

  try {
    const startTime = Date.now();
    const response = await fetch("https://httpbin.org/get", {
      method: "GET",
      timeout: 5000,
    });
    networkTest.duration = Date.now() - startTime;

    if (response.ok) {
      networkTest.status = "success";
    } else {
      networkTest.status = "error";
      networkTest.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error: any) {
    networkTest.status = "error";
    networkTest.error = error.message || "Connection failed";
  }

  tests.push(networkTest);

  return tests;
}

// Test authentication flow step by step
export async function testAuthFlow(queryClient: QueryClient): Promise<AuthFlowStep[]> {
  const steps: AuthFlowStep[] = [];

  // Step 1: Check current auth status
  const authStatusStep: AuthFlowStep = {
    step: "Check Auth Status",
    status: "pending",
    timestamp: Date.now(),
  };

  try {
    const startTime = Date.now();
    const authStatus = await queryClient.fetchQuery({
      ...convexQuery(api.auth.getAuthStatus, {}),
      staleTime: 0, // Force fresh fetch
    });
    authStatusStep.duration = Date.now() - startTime;
    authStatusStep.status = "success";
    authStatusStep.data = {
      isAuthenticated: authStatus.isAuthenticated,
      hasUser: !!authStatus.user,
      error: authStatus.error,
    };
  } catch (error: any) {
    authStatusStep.status = "error";
    authStatusStep.error = error.message;
    authStatusStep.duration = Date.now() - authStatusStep.timestamp;
  }

  steps.push(authStatusStep);

  // Step 2: Test user profile query
  const userProfileStep: AuthFlowStep = {
    step: "Fetch User Profile",
    status: "pending",
    timestamp: Date.now(),
  };

  try {
    const startTime = Date.now();
    const userProfile = await queryClient.fetchQuery({
      ...convexQuery(api.auth.getUserProfile, {}),
      staleTime: 0,
    });
    userProfileStep.duration = Date.now() - startTime;
    userProfileStep.status = "success";
    userProfileStep.data = {
      hasProfile: !!userProfile,
      profileFields: userProfile ? Object.keys(userProfile) : [],
    };
  } catch (error: any) {
    userProfileStep.status = "error";
    userProfileStep.error = error.message;
    userProfileStep.duration = Date.now() - userProfileStep.timestamp;
  }

  steps.push(userProfileStep);

  // Step 3: Test authenticated query
  const authenticatedQueryStep: AuthFlowStep = {
    step: "Test Authenticated Query",
    status: "pending",
    timestamp: Date.now(),
  };

  try {
    const startTime = Date.now();
    const isAuthenticated = await queryClient.fetchQuery({
      ...convexQuery(api.auth.isAuthenticatedQuery, {}),
      staleTime: 0,
    });
    authenticatedQueryStep.duration = Date.now() - startTime;
    authenticatedQueryStep.status = "success";
    authenticatedQueryStep.data = { isAuthenticated };
  } catch (error: any) {
    authenticatedQueryStep.status = "error";
    authenticatedQueryStep.error = error.message;
    authenticatedQueryStep.duration = Date.now() - authenticatedQueryStep.timestamp;
  }

  steps.push(authenticatedQueryStep);

  // Step 4: Test protected resource access
  const protectedResourceStep: AuthFlowStep = {
    step: "Access Protected Resource",
    status: "pending",
    timestamp: Date.now(),
  };

  try {
    const startTime = Date.now();
    const collections = await queryClient.fetchQuery({
      ...convexQuery(api.shoes.getCollections, {}),
      staleTime: 0,
    });
    protectedResourceStep.duration = Date.now() - startTime;
    protectedResourceStep.status = "success";
    protectedResourceStep.data = {
      collectionsCount: collections?.length || 0,
    };
  } catch (error: any) {
    protectedResourceStep.status = "error";
    protectedResourceStep.error = error.message;
    protectedResourceStep.duration = Date.now() - protectedResourceStep.timestamp;
  }

  steps.push(protectedResourceStep);

  return steps;
}

// Analyze configuration
export function analyzeAuthConfiguration(): AuthDiagnosticResult["configuration"] {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  let convexUrlFormat: "valid" | "invalid" | "missing" = "missing";
  if (convexUrl) {
    if (convexUrl.startsWith("https://") && convexUrl.includes(".convex.cloud")) {
      convexUrlFormat = "valid";
    } else {
      convexUrlFormat = "invalid";
    }
  }

  return {
    hasConvexUrl: !!convexUrl,
    convexUrlFormat,
    googleAuthConfigured: true, // Assume configured if app loads
    environmentVariables: {
      VITE_CONVEX_URL: convexUrl ? "set" : "missing",
      NODE_ENV: import.meta.env.NODE_ENV ? "set" : "missing",
    },
  };
}

// Generate recommendations based on diagnostic results
export function generateRecommendations(
  environment: AuthEnvironmentInfo,
  connectivity: AuthConnectivityTest[],
  authFlow: AuthFlowStep[],
  configuration: AuthDiagnosticResult["configuration"]
): string[] {
  const recommendations: string[] = [];

  // Environment recommendations
  if (environment.environment === "production") {
    recommendations.push("🔍 Production environment detected - check server logs for detailed errors");
  }

  // Configuration recommendations
  if (!configuration.hasConvexUrl) {
    recommendations.push("❌ VITE_CONVEX_URL is missing - add it to your .env.local file");
  } else if (configuration.convexUrlFormat === "invalid") {
    recommendations.push("⚠️ VITE_CONVEX_URL format appears invalid - ensure it matches https://your-deployment.convex.cloud");
  }

  // Connectivity recommendations
  const failedConnectivity = connectivity.filter(test => test.status === "error");
  if (failedConnectivity.length > 0) {
    recommendations.push(`🌐 ${failedConnectivity.length} connectivity test(s) failed - check network connection and firewall settings`);

    const convexFailed = failedConnectivity.find(test => test.name.includes("Convex"));
    if (convexFailed) {
      recommendations.push("🔧 Convex connectivity failed - verify your deployment is active and URL is correct");
    }

    const googleFailed = failedConnectivity.find(test => test.name.includes("Google"));
    if (googleFailed) {
      recommendations.push("🔑 Google OAuth connectivity failed - check if OAuth is blocked by network policies");
    }
  }

  // Auth flow recommendations
  const failedSteps = authFlow.filter(step => step.status === "error");
  if (failedSteps.length > 0) {
    recommendations.push(`🔒 ${failedSteps.length} authentication step(s) failed`);

    const authStatusFailed = failedSteps.find(step => step.step.includes("Auth Status"));
    if (authStatusFailed) {
      recommendations.push("🔧 Basic auth status check failed - verify Convex auth is properly configured");
    }

    const userProfileFailed = failedSteps.find(step => step.step.includes("User Profile"));
    if (userProfileFailed) {
      recommendations.push("👤 User profile fetch failed - user may not be properly authenticated");
    }

    const protectedResourceFailed = failedSteps.find(step => step.step.includes("Protected Resource"));
    if (protectedResourceFailed) {
      recommendations.push("🛡️ Protected resource access failed - check authentication and permissions");
    }
  }

  // Performance recommendations
  const slowSteps = authFlow.filter(step => step.duration && step.duration > 2000);
  if (slowSteps.length > 0) {
    recommendations.push("⏱️ Some authentication operations are slow - consider optimizing queries or checking network latency");
  }

  // Success recommendations
  if (failedConnectivity.length === 0 && failedSteps.length === 0) {
    recommendations.push("✅ All authentication diagnostics passed - system appears healthy");
  }

  return recommendations;
}

// Run comprehensive auth diagnostics
export async function runAuthDiagnostics(queryClient: QueryClient): Promise<AuthDiagnosticResult> {
  const environment = getAuthEnvironmentInfo();
  const connectivity = await runConnectivityTests();
  const authFlow = await testAuthFlow(queryClient);
  const configuration = analyzeAuthConfiguration();

  const recommendations = generateRecommendations(environment, connectivity, authFlow, configuration);

  // Determine overall health
  const hasErrors = connectivity.some(test => test.status === "error") ||
                   authFlow.some(step => step.status === "error");
  const hasWarnings = !configuration.hasConvexUrl ||
                     configuration.convexUrlFormat === "invalid";

  let overall: "healthy" | "warning" | "error" = "healthy";
  if (hasErrors) {
    overall = "error";
  } else if (hasWarnings) {
    overall = "warning";
  }

  return {
    overall,
    environment,
    connectivity,
    authFlow,
    configuration,
    recommendations,
    debugData: {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    },
  };
}

// Export auth debug events from AuthProvider if available
export async function exportAuthDebugEvents(): Promise<any[]> {
  try {
    // Try to access the authDebug export from AuthProvider
    const { authDebug } = await import("~/components/AuthProvider");
    return authDebug.getEvents();
  } catch (error) {
    console.warn("Could not access auth debug events:", error);
    return [];
  }
}

// Export auth metrics from AuthProvider if available
export async function exportAuthMetrics(): Promise<any> {
  try {
    const { authDebug } = await import("~/components/AuthProvider");
    return authDebug.getMetrics();
  } catch (error) {
    console.warn("Could not access auth metrics:", error);
    return null;
  }
}

// Format debug data for export/sharing
export function formatDebugDataForExport(diagnostics: AuthDiagnosticResult): string {
  const sanitizedDiagnostics = {
    ...diagnostics,
    environment: {
      ...diagnostics.environment,
      convexUrl: diagnostics.environment.convexUrl ? "***CONFIGURED***" : null,
    },
  };

  return JSON.stringify(sanitizedDiagnostics, null, 2);
}

// Compare development vs production configurations
export function compareEnvironments(devConfig: any, prodConfig: any): string[] {
  const differences: string[] = [];

  if (devConfig.environment !== prodConfig.environment) {
    differences.push(`Environment: ${devConfig.environment} vs ${prodConfig.environment}`);
  }

  if (devConfig.domain !== prodConfig.domain) {
    differences.push(`Domain: ${devConfig.domain} vs ${prodConfig.domain}`);
  }

  if (devConfig.protocol !== prodConfig.protocol) {
    differences.push(`Protocol: ${devConfig.protocol} vs ${prodConfig.protocol}`);
  }

  return differences;
}
