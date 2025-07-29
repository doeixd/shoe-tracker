#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Script
 * Tests authentication functionality across different environments
 * Run with: node scripts/test-auth-comprehensive.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Test configuration
const TEST_CONFIG = {
  dev: {
    url: 'http://localhost:3000',
    name: 'Development',
  },
  prod: {
    url: process.env.PROD_URL || 'https://myshoetracker.fun',
    name: 'Production',
  },
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`${message}`, colors.bold + colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
}

function logSubHeader(message) {
  log(`\n${'-'.repeat(40)}`, colors.cyan);
  log(`${message}`, colors.cyan);
  log(`${'-'.repeat(40)}`, colors.cyan);
}

function logTest(testName) {
  log(`\n🧪 ${testName}`, colors.yellow);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  environments: {},
};

function recordTest(testName, passed, warning = false, environment = 'general') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  if (warning) {
    testResults.warnings++;
  }

  if (!testResults.environments[environment]) {
    testResults.environments[environment] = { passed: 0, failed: 0, total: 0 };
  }
  testResults.environments[environment].total++;
  if (passed) {
    testResults.environments[environment].passed++;
  } else {
    testResults.environments[environment].failed++;
  }
}

/**
 * Check if environment variables are properly configured
 */
async function checkEnvironmentConfiguration() {
  logSubHeader('Environment Configuration Check');

  // Check for .env.local
  const envPath = path.join(projectRoot, '.env.local');
  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found');
    recordTest('Environment file exists', false);
    return false;
  }
  logSuccess('.env.local file exists');

  // Read environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  // Check required variables
  const requiredVars = ['VITE_CONVEX_URL'];
  let allConfigured = true;

  for (const varName of requiredVars) {
    if (!envVars[varName]) {
      logError(`${varName} is not set`);
      allConfigured = false;
    } else if (envVars[varName].includes('your-deployment') || envVars[varName].includes('example')) {
      logWarning(`${varName} appears to be a placeholder value`);
      allConfigured = false;
    } else {
      logSuccess(`${varName} is configured`);
    }
  }

  recordTest('Environment configuration', allConfigured);

  // Check Convex URL format
  if (envVars.VITE_CONVEX_URL) {
    const convexUrl = envVars.VITE_CONVEX_URL;
    if (convexUrl.startsWith('https://') && convexUrl.includes('.convex.cloud')) {
      logSuccess('Convex URL format is valid');
      recordTest('Convex URL format', true);
    } else {
      logError('Convex URL format appears invalid');
      logInfo('Expected format: https://your-deployment.convex.cloud');
      recordTest('Convex URL format', false);
    }
  }

  return allConfigured;
}

/**
 * Test server health and accessibility
 */
async function testServerHealth(baseUrl, environmentName) {
  logTest(`Server Health Check - ${environmentName}`);

  try {
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      timeout: 10000,
    });

    if (response.ok) {
      logSuccess(`${environmentName} server is accessible (${response.status})`);
      recordTest(`${environmentName} server health`, true, false, environmentName.toLowerCase());
      return true;
    } else {
      logError(`${environmentName} server returned ${response.status}: ${response.statusText}`);
      recordTest(`${environmentName} server health`, false, false, environmentName.toLowerCase());
      return false;
    }
  } catch (error) {
    logError(`${environmentName} server is not accessible: ${error.message}`);
    if (environmentName === 'Development') {
      logInfo('Make sure to start the dev server with: npm run dev');
    }
    recordTest(`${environmentName} server health`, false, false, environmentName.toLowerCase());
    return false;
  }
}

/**
 * Test authentication flow for unauthenticated users
 */
async function testUnauthenticatedFlow(baseUrl, environmentName) {
  logTest(`Unauthenticated Flow - ${environmentName}`);

  try {
    // Test home page redirect
    const homeResponse = await fetch(`${baseUrl}/`, {
      redirect: 'manual',
      timeout: 15000,
    });

    if (homeResponse.status === 302 || homeResponse.status === 301) {
      const location = homeResponse.headers.get('location');
      if (location && location.includes('/auth/signin')) {
        logSuccess(`${environmentName}: Home page correctly redirects to sign-in`);
        recordTest(`${environmentName} home redirect`, true, false, environmentName.toLowerCase());
      } else {
        logError(`${environmentName}: Home page redirects to unexpected location: ${location}`);
        recordTest(`${environmentName} home redirect`, false, false, environmentName.toLowerCase());
      }
    } else if (homeResponse.status === 200) {
      const html = await homeResponse.text();
      if (html.includes('Sign in required') ||
          html.includes('Authentication Required') ||
          html.includes('Continue with Google')) {
        logSuccess(`${environmentName}: Home page shows sign-in required message`);
        recordTest(`${environmentName} home auth check`, true, false, environmentName.toLowerCase());
      } else {
        logError(`${environmentName}: Home page accessible without authentication`);
        recordTest(`${environmentName} home auth check`, false, false, environmentName.toLowerCase());
      }
    } else {
      logError(`${environmentName}: Unexpected home page response: ${homeResponse.status}`);
      recordTest(`${environmentName} home response`, false, false, environmentName.toLowerCase());
    }

    // Test sign-in page
    const signinResponse = await fetch(`${baseUrl}/auth/signin`, {
      timeout: 15000,
    });

    if (signinResponse.ok) {
      const html = await signinResponse.text();
      if (html.includes('Continue with Google') ||
          html.includes('Welcome to Shoe Tracker')) {
        logSuccess(`${environmentName}: Sign-in page loads correctly`);
        recordTest(`${environmentName} signin page`, true, false, environmentName.toLowerCase());
      } else {
        logWarning(`${environmentName}: Sign-in page missing expected content`);
        recordTest(`${environmentName} signin page`, true, true, environmentName.toLowerCase());
      }
    } else {
      logError(`${environmentName}: Sign-in page failed to load (${signinResponse.status})`);
      recordTest(`${environmentName} signin page`, false, false, environmentName.toLowerCase());
    }

    // Test protected route redirect
    const protectedResponse = await fetch(`${baseUrl}/collections`, {
      redirect: 'manual',
      timeout: 15000,
    });

    if (protectedResponse.status === 302 || protectedResponse.status === 301) {
      const location = protectedResponse.headers.get('location');
      if (location && location.includes('/auth/signin')) {
        logSuccess(`${environmentName}: Protected routes correctly redirect to sign-in`);
        recordTest(`${environmentName} protected redirect`, true, false, environmentName.toLowerCase());
      } else {
        logError(`${environmentName}: Protected route redirects incorrectly: ${location}`);
        recordTest(`${environmentName} protected redirect`, false, false, environmentName.toLowerCase());
      }
    } else {
      logWarning(`${environmentName}: Protected route response: ${protectedResponse.status}`);
      recordTest(`${environmentName} protected redirect`, false, true, environmentName.toLowerCase());
    }

  } catch (error) {
    logError(`${environmentName}: Authentication flow test failed: ${error.message}`);
    recordTest(`${environmentName} auth flow`, false, false, environmentName.toLowerCase());
  }
}

/**
 * Test API endpoints and connectivity
 */
async function testAPIConnectivity(baseUrl, environmentName) {
  logTest(`API Connectivity - ${environmentName}`);

  // Test debug dashboard
  try {
    const debugResponse = await fetch(`${baseUrl}/debug-dashboard`, {
      timeout: 15000,
    });

    if (debugResponse.ok) {
      logSuccess(`${environmentName}: Debug dashboard accessible`);
      recordTest(`${environmentName} debug dashboard`, true, false, environmentName.toLowerCase());
    } else {
      logWarning(`${environmentName}: Debug dashboard returned ${debugResponse.status}`);
      recordTest(`${environmentName} debug dashboard`, false, true, environmentName.toLowerCase());
    }
  } catch (error) {
    logError(`${environmentName}: Debug dashboard test failed: ${error.message}`);
    recordTest(`${environmentName} debug dashboard`, false, false, environmentName.toLowerCase());
  }

  // Test static assets
  try {
    const assetsResponse = await fetch(`${baseUrl}/favicon.ico`, {
      timeout: 10000,
    });

    if (assetsResponse.ok) {
      logSuccess(`${environmentName}: Static assets loading`);
      recordTest(`${environmentName} static assets`, true, false, environmentName.toLowerCase());
    } else {
      logWarning(`${environmentName}: Static assets might have issues`);
      recordTest(`${environmentName} static assets`, false, true, environmentName.toLowerCase());
    }
  } catch (error) {
    logWarning(`${environmentName}: Static assets test inconclusive: ${error.message}`);
    recordTest(`${environmentName} static assets`, false, true, environmentName.toLowerCase());
  }
}

/**
 * Test error handling
 */
async function testErrorHandling(baseUrl, environmentName) {
  logTest(`Error Handling - ${environmentName}`);

  try {
    // Test 404 handling
    const notFoundResponse = await fetch(`${baseUrl}/nonexistent-route-12345`, {
      timeout: 15000,
    });

    if (notFoundResponse.status === 404) {
      const html = await notFoundResponse.text();
      if (html.includes('Not Found') || html.includes('404') || html.includes('Page not found')) {
        logSuccess(`${environmentName}: 404 errors handled correctly`);
        recordTest(`${environmentName} 404 handling`, true, false, environmentName.toLowerCase());
      } else {
        logWarning(`${environmentName}: 404 handling could be improved`);
        recordTest(`${environmentName} 404 handling`, true, true, environmentName.toLowerCase());
      }
    } else {
      logWarning(`${environmentName}: Expected 404 but got ${notFoundResponse.status}`);
      recordTest(`${environmentName} 404 handling`, false, true, environmentName.toLowerCase());
    }
  } catch (error) {
    logError(`${environmentName}: Error handling test failed: ${error.message}`);
    recordTest(`${environmentName} 404 handling`, false, false, environmentName.toLowerCase());
  }
}

/**
 * Test performance and loading
 */
async function testPerformance(baseUrl, environmentName) {
  logTest(`Performance Test - ${environmentName}`);

  try {
    const startTime = Date.now();
    const response = await fetch(baseUrl, {
      timeout: 20000,
    });
    const loadTime = Date.now() - startTime;

    if (response.ok) {
      if (loadTime < 3000) {
        logSuccess(`${environmentName}: Good load time (${loadTime}ms)`);
        recordTest(`${environmentName} performance`, true, false, environmentName.toLowerCase());
      } else if (loadTime < 8000) {
        logWarning(`${environmentName}: Slow load time (${loadTime}ms)`);
        recordTest(`${environmentName} performance`, true, true, environmentName.toLowerCase());
      } else {
        logError(`${environmentName}: Very slow load time (${loadTime}ms)`);
        recordTest(`${environmentName} performance`, false, false, environmentName.toLowerCase());
      }
    } else {
      logError(`${environmentName}: Performance test failed (${response.status})`);
      recordTest(`${environmentName} performance`, false, false, environmentName.toLowerCase());
    }
  } catch (error) {
    logError(`${environmentName}: Performance test failed: ${error.message}`);
    recordTest(`${environmentName} performance`, false, false, environmentName.toLowerCase());
  }
}

/**
 * Test environment-specific configurations
 */
async function testEnvironmentSpecific(baseUrl, environmentName) {
  logTest(`Environment-Specific Tests - ${environmentName}`);

  if (environmentName === 'Production') {
    // Test HTTPS
    if (baseUrl.startsWith('https://')) {
      logSuccess('Production: Using HTTPS');
      recordTest('Production HTTPS', true, false, 'production');
    } else {
      logError('Production: Not using HTTPS');
      recordTest('Production HTTPS', false, false, 'production');
    }

    // Test security headers (basic check)
    try {
      const response = await fetch(baseUrl, { timeout: 10000 });
      const headers = response.headers;

      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
      ];

      let hasSecurityHeaders = false;
      for (const header of securityHeaders) {
        if (headers.get(header)) {
          hasSecurityHeaders = true;
          break;
        }
      }

      if (hasSecurityHeaders) {
        logSuccess('Production: Security headers detected');
        recordTest('Production security headers', true, false, 'production');
      } else {
        logWarning('Production: No security headers detected');
        recordTest('Production security headers', false, true, 'production');
      }
    } catch (error) {
      logWarning('Production: Could not check security headers');
      recordTest('Production security headers', false, true, 'production');
    }
  }

  if (environmentName === 'Development') {
    // Check if dev server is running with expected features
    try {
      const response = await fetch(baseUrl, { timeout: 10000 });
      const html = await response.text();

      if (html.includes('vite') || html.includes('@vite/client')) {
        logSuccess('Development: Vite dev server detected');
        recordTest('Development vite', true, false, 'development');
      } else {
        logInfo('Development: Vite markers not found (might be production build)');
        recordTest('Development vite', true, true, 'development');
      }
    } catch (error) {
      logWarning('Development: Could not check dev server features');
      recordTest('Development vite', false, true, 'development');
    }
  }
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations() {
  const recommendations = [];

  if (testResults.failed > 0) {
    recommendations.push('🔧 Some tests failed - review the errors above and fix critical issues');
  }

  if (testResults.warnings > 0) {
    recommendations.push('⚠️  Some warnings detected - consider addressing these for better reliability');
  }

  // Environment-specific recommendations
  Object.entries(testResults.environments).forEach(([env, results]) => {
    if (results.failed > 0) {
      recommendations.push(`🌍 ${env} environment has ${results.failed} failing tests`);
    }
  });

  if (testResults.passed === testResults.total) {
    recommendations.push('✅ All tests passed! Your authentication system appears to be working correctly');
  }

  return recommendations;
}

/**
 * Main test runner
 */
async function runComprehensiveTests() {
  logHeader('🚀 Comprehensive Authentication Test Suite');

  log(`${colors.cyan}Testing authentication across multiple environments...${colors.reset}`);
  log(`${colors.dim}Started at: ${new Date().toLocaleString()}${colors.reset}\n`);

  // Step 1: Environment Configuration
  logHeader('📋 Step 1: Environment Configuration');
  await checkEnvironmentConfiguration();

  // Step 2: Test each environment
  for (const [envKey, config] of Object.entries(TEST_CONFIG)) {
    logHeader(`🌍 Step 2.${envKey === 'dev' ? '1' : '2'}: Testing ${config.name} Environment`);

    const serverHealthy = await testServerHealth(config.url, config.name);

    if (serverHealthy) {
      await testUnauthenticatedFlow(config.url, config.name);
      await testAPIConnectivity(config.url, config.name);
      await testErrorHandling(config.url, config.name);
      await testPerformance(config.url, config.name);
      await testEnvironmentSpecific(config.url, config.name);
    } else {
      logWarning(`Skipping additional tests for ${config.name} due to server health issues`);
    }
  }

  // Step 3: Results Summary
  logHeader('📊 Test Results Summary');

  log(`\n${colors.bold}Overall Results:${colors.reset}`);
  log(`Total Tests: ${testResults.total}`);
  log(`✅ Passed: ${testResults.passed}`, colors.green);
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? colors.red : colors.green);
  log(`⚠️  Warnings: ${testResults.warnings}`, testResults.warnings > 0 ? colors.yellow : colors.green);

  // Environment breakdown
  log(`\n${colors.bold}Environment Breakdown:${colors.reset}`);
  Object.entries(testResults.environments).forEach(([env, results]) => {
    const percentage = Math.round((results.passed / results.total) * 100);
    log(`${env}: ${results.passed}/${results.total} (${percentage}%) passed`);
  });

  // Recommendations
  const recommendations = generateRecommendations();
  if (recommendations.length > 0) {
    log(`\n${colors.bold}💡 Recommendations:${colors.reset}`);
    recommendations.forEach(rec => log(rec));
  }

  // Manual testing suggestions
  logHeader('📝 Manual Testing Checklist');
  log('1. 🖱️  Open browser and test Google sign-in flow');
  log('2. 🔄 Verify sign-out functionality works correctly');
  log('3. 🚪 Test that protected routes redirect properly');
  log('4. 🔍 Check browser console for any JavaScript errors');
  log('5. 📱 Test on mobile devices and different browsers');
  log('6. 🌐 Verify production OAuth configuration with Google');
  log('7. 🔧 Run debug dashboard for detailed auth diagnostics');

  // Final status
  log(`\n${colors.bold}Final Status:${colors.reset}`);
  if (testResults.failed === 0) {
    log('🎉 All critical tests passed! Authentication system appears healthy.', colors.green);
  } else if (testResults.failed <= 2) {
    log('⚠️  Minor issues detected. System may still function but needs attention.', colors.yellow);
  } else {
    log('🚨 Significant issues detected. Authentication system may not work properly.', colors.red);
  }

  log(`\n${colors.dim}Completed at: ${new Date().toLocaleString()}${colors.reset}`);

  // Exit with appropriate code
  process.exit(testResults.failed > 2 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export { runComprehensiveTests };
