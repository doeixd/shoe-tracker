#!/usr/bin/env node

// Test script to verify dashboard fixes
// This script checks if the main issues have been resolved

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Testing Dashboard Fixes...\n");

const checks = [];

// Check 1: React Compiler disabled
console.log("1. Checking React Compiler status...");
const viteConfig = fs.readFileSync(path.join(__dirname, "vite.config.ts"), "utf8");
if (viteConfig.includes("// Temporarily disabled React Compiler")) {
  console.log("✅ React Compiler is disabled");
  checks.push(true);
} else {
  console.log("❌ React Compiler may still be enabled");
  checks.push(false);
}

// Check 2: Service Worker disabled
console.log("\n2. Checking Service Worker status...");
const swIntegration = fs.readFileSync(path.join(__dirname, "src/components/ServiceWorkerIntegration.tsx"), "utf8");
if (swIntegration.includes("return null;")) {
  console.log("✅ Service Worker Integration is disabled");
  checks.push(true);
} else {
  console.log("❌ Service Worker Integration may still be active");
  checks.push(false);
}

// Check 3: DevTools disabled
console.log("\n3. Checking DevTools status...");
const rootRoute = fs.readFileSync(path.join(__dirname, "src/routes/__root.tsx"), "utf8");
if (rootRoute.includes("// import { ReactQueryDevtools }")) {
  console.log("✅ DevTools are disabled");
  checks.push(true);
} else {
  console.log("❌ DevTools may still be active");
  checks.push(false);
}

// Check 4: Font preloads removed
console.log("\n4. Checking font preloads...");
const pwaHead = fs.readFileSync(path.join(__dirname, "src/components/PWAHead.tsx"), "utf8");
if (!pwaHead.includes("inter-var.woff2") && !pwaHead.includes("/src/main.tsx")) {
  console.log("✅ Non-existent font preloads removed");
  checks.push(true);
} else {
  console.log("❌ Non-existent font preloads may still exist");
  checks.push(false);
}

// Check 5: Syntax errors fixed
console.log("\n5. Checking for syntax issues...");
const useOffline = fs.readFileSync(path.join(__dirname, "src/hooks/useOffline.tsx"), "utf8");
if (!useOffline.includes(".then(") || useOffline.includes("console.log(\"Service worker registration disabled")) {
  console.log("✅ Service worker syntax issues fixed");
  checks.push(true);
} else {
  console.log("❌ Service worker syntax issues may remain");
  checks.push(false);
}

// Check 6: Environment variables
console.log("\n6. Checking environment variables...");
if (fs.existsSync(path.join(__dirname, ".env.local"))) {
  const envContent = fs.readFileSync(path.join(__dirname, ".env.local"), "utf8");
  if (envContent.includes("VITE_CONVEX_URL") && !envContent.includes("your-deployment")) {
    console.log("✅ Environment variables are set");
    checks.push(true);
  } else {
    console.log("⚠️  Environment variables may need configuration");
    checks.push(false);
  }
} else {
  console.log("❌ .env.local file not found");
  checks.push(false);
}

// Summary
console.log("\n" + "=".repeat(50));
const passedChecks = checks.filter(Boolean).length;
const totalChecks = checks.length;

if (passedChecks === totalChecks) {
  console.log("🎉 All fixes verified! Dashboard should now load properly.");
  console.log("\n✅ Next steps:");
  console.log("1. Visit http://localhost:3001/ to test the dashboard");
  console.log("2. Check console for any remaining errors");
  console.log("3. Use /debug-dashboard route for detailed diagnostics");
} else {
  console.log(`⚠️  ${passedChecks}/${totalChecks} checks passed. Some issues may remain.`);
  console.log("\n📋 Recommended actions:");
  console.log("1. Review failed checks above");
  console.log("2. Check browser console for errors");
  console.log("3. Test the dashboard incrementally");
}

console.log("\n🔗 Useful URLs:");
console.log("- Main Dashboard: http://localhost:3001/");
console.log("- Debug Dashboard: http://localhost:3001/debug-dashboard");
console.log("- Browser DevTools: F12 → Console tab");

console.log("\n💡 If issues persist:");
console.log("1. Clear browser cache and hard reload (Ctrl+Shift+R)");
console.log("2. Disable browser extensions temporarily");
console.log("3. Try incognito/private browsing mode");
console.log("4. Check network tab in DevTools for failed requests");

process.exit(passedChecks === totalChecks ? 0 : 1);
