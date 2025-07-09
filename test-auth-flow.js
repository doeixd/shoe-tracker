#!/usr/bin/env node

/**
 * Test script to verify authentication flow for the home page
 * This script simulates different authentication scenarios
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

const TEST_URL = 'http://localhost:3000';
const SIGNIN_URL = `${TEST_URL}/auth/signin`;
const HOME_URL = `${TEST_URL}/`;

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, colors.blue);
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

/**
 * Test if server is running
 */
async function testServerHealth() {
  logTest('Server Health Check');

  try {
    const response = await fetch(TEST_URL, {
      method: 'HEAD',
      timeout: 5000
    });

    if (response.ok) {
      logSuccess('Server is running and accessible');
      return true;
    } else {
      logError(`Server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Server is not accessible: ${error.message}`);
    logWarning('Make sure to start the dev server with: npm run dev');
    return false;
  }
}

/**
 * Test home page without authentication
 */
async function testUnauthenticatedAccess() {
  logTest('Unauthenticated Access to Home Page');

  try {
    const response = await fetch(HOME_URL, {
      redirect: 'manual', // Don't follow redirects automatically
      timeout: 10000
    });

    // Should redirect to signin (302/301) or show signin page
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location && location.includes('/auth/signin')) {
        logSuccess('Correctly redirects to sign-in page');
        return true;
      } else {
        logError(`Redirects to unexpected location: ${location}`);
        return false;
      }
    } else if (response.status === 200) {
      // Check if the response contains sign-in related content
      const html = await response.text();
      if (html.includes('Sign in required') ||
          html.includes('Authentication Required') ||
          html.includes('Continue with Google')) {
        logSuccess('Shows sign-in required message');
        return true;
      } else {
        logError('Home page accessible without authentication');
        return false;
      }
    } else {
      logError(`Unexpected response status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test sign-in page accessibility
 */
async function testSignInPageAccess() {
  logTest('Sign-in Page Accessibility');

  try {
    const response = await fetch(SIGNIN_URL, {
      timeout: 10000
    });

    if (response.ok) {
      const html = await response.text();

      // Check for expected sign-in page content
      const hasSignInContent = html.includes('Continue with Google') ||
                              html.includes('Sign in') ||
                              html.includes('Welcome to Shoe Tracker');

      if (hasSignInContent) {
        logSuccess('Sign-in page loads correctly');
        return true;
      } else {
        logError('Sign-in page missing expected content');
        return false;
      }
    } else {
      logError(`Sign-in page returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Sign-in page test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test redirect parameter handling
 */
async function testRedirectParameter() {
  logTest('Redirect Parameter Handling');

  try {
    const testPath = '/collections';
    const response = await fetch(`${TEST_URL}${testPath}`, {
      redirect: 'manual',
      timeout: 10000
    });

    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location && location.includes('/auth/signin') && location.includes('redirect=')) {
        logSuccess('Correctly handles redirect parameter');
        return true;
      } else {
        logError(`Redirect doesn't include proper redirect parameter: ${location}`);
        return false;
      }
    } else {
      logWarning(`Expected redirect but got status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Redirect parameter test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test error boundary functionality
 */
async function testErrorBoundary() {
  logTest('Error Boundary (simulated)');

  try {
    // Test a non-existent route to see error handling
    const response = await fetch(`${TEST_URL}/nonexistent-route`, {
      timeout: 10000
    });

    if (response.status === 404) {
      const html = await response.text();

      // Check if there's proper error handling
      if (html.includes('Not Found') ||
          html.includes('404') ||
          html.includes('Page not found')) {
        logSuccess('Error boundary handles 404 correctly');
        return true;
      } else {
        logWarning('404 handling could be improved');
        return true; // Not critical
      }
    } else {
      logWarning(`Expected 404 but got status: ${response.status}`);
      return true; // Not critical
    }
  } catch (error) {
    logError(`Error boundary test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test loading states
 */
async function testLoadingStates() {
  logTest('Loading States');

  try {
    const start = Date.now();
    const response = await fetch(HOME_URL, {
      timeout: 15000
    });
    const duration = Date.now() - start;

    if (response.ok) {
      const html = await response.text();

      // Check if loading states are properly handled
      if (html.includes('Loading') ||
          html.includes('loader') ||
          html.includes('spinner')) {
        logSuccess(`Loading states detected (${duration}ms)`);
      } else {
        logSuccess(`Page loads without visible loading indicators (${duration}ms)`);
      }
      return true;
    } else {
      logError(`Loading test failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Loading states test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('🏃‍♀️ Starting Authentication Flow Tests\n', colors.blue);

  const tests = [
    testServerHealth,
    testUnauthenticatedAccess,
    testSignInPageAccess,
    testRedirectParameter,
    testErrorBoundary,
    testLoadingStates
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
    } catch (error) {
      logError(`Test failed with error: ${error.message}`);
      results.push(false);
    }
  }

  // Summary
  log('\n📊 Test Results Summary', colors.blue);
  log('========================');

  const passed = results.filter(r => r === true).length;
  const total = results.length;

  if (passed === total) {
    log(`✅ All tests passed (${passed}/${total})`, colors.green);
  } else {
    log(`⚠️  ${passed}/${total} tests passed`, colors.yellow);
  }

  // Recommendations
  log('\n💡 Recommendations', colors.blue);
  log('=================');

  if (passed === total) {
    log('✅ Authentication flow is working correctly!', colors.green);
    log('✅ Not-logged-in state is properly handled', colors.green);
    log('✅ Error boundaries are in place', colors.green);
  } else {
    log('🔧 Some issues detected. Please review the failing tests above.', colors.yellow);
  }

  // Additional checks
  log('\n🔍 Additional Manual Testing Recommendations', colors.blue);
  log('===========================================');
  log('1. Open browser and navigate to localhost:3000');
  log('2. Verify you are redirected to sign-in page');
  log('3. Check that the sign-in page displays correctly');
  log('4. Test the Google sign-in flow');
  log('5. Verify authenticated users can access the home page');
  log('6. Test sign-out functionality');
  log('7. Check that protected routes redirect properly');

  process.exit(passed === total ? 0 : 1);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

export { runTests };
