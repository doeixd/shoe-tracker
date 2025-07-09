#!/usr/bin/env node

// Environment Check Script for MyShoeTracker
// This script checks if all required environment variables are set

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Checking Environment Configuration...\n");

// Check if .env.local exists
const envPath = path.join(__dirname, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file not found!");
  console.log("📝 Creating a template .env.local file...\n");

  const template = `# Convex Configuration
# Replace with your actual Convex deployment URL
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Development settings
NODE_ENV=development

# Add other environment variables as needed
`;

  fs.writeFileSync(envPath, template);
  console.log("✅ Created .env.local template");
  console.log(
    "⚠️  Please update VITE_CONVEX_URL with your actual Convex deployment URL",
  );
  console.log("   You can get this from https://dashboard.convex.dev\n");
  process.exit(1);
}

// Read and parse .env.local
const envContent = fs.readFileSync(envPath, "utf8");
const envVars = {};

envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, value] = trimmed.split("=");
    if (key && value) {
      envVars[key] = value;
    }
  }
});

// Check required environment variables
const requiredVars = ["VITE_CONVEX_URL"];

let allGood = true;

console.log("Environment Variables Status:");
console.log("============================");

requiredVars.forEach((varName) => {
  const value = envVars[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    allGood = false;
  } else if (value.includes("your-deployment") || value.includes("example")) {
    console.log(`⚠️  ${varName}: SET BUT LOOKS LIKE PLACEHOLDER`);
    console.log(`   Current value: ${value}`);
    allGood = false;
  } else {
    console.log(`✅ ${varName}: SET`);
    console.log(`   Value: ${value}`);
  }
});

console.log("\nOptional Variables:");
console.log("==================");

const optionalVars = ["NODE_ENV", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"];

optionalVars.forEach((varName) => {
  const value = envVars[varName];
  if (value) {
    console.log(`✅ ${varName}: SET`);
  } else {
    console.log(`ℹ️  ${varName}: NOT SET (optional)`);
  }
});

// Additional checks
console.log("\nAdditional Checks:");
console.log("=================");

// Check if Convex URL is reachable (basic format check)
if (envVars.VITE_CONVEX_URL) {
  const convexUrl = envVars.VITE_CONVEX_URL;
  if (convexUrl.startsWith("https://") && convexUrl.includes(".convex.cloud")) {
    console.log("✅ CONVEX_URL format looks correct");
  } else {
    console.log("⚠️  CONVEX_URL format may be incorrect");
    console.log("   Expected format: https://your-deployment.convex.cloud");
    allGood = false;
  }
}

// Check if package.json exists
if (fs.existsSync(path.join(__dirname, "package.json"))) {
  console.log("✅ package.json found");
} else {
  console.log("❌ package.json not found");
  allGood = false;
}

// Check if convex directory exists
if (fs.existsSync(path.join(__dirname, "convex"))) {
  console.log("✅ convex directory found");
} else {
  console.log("❌ convex directory not found");
  allGood = false;
}

console.log("\n" + "=".repeat(50));

if (allGood) {
  console.log("🎉 All environment variables are properly configured!");
  console.log("✅ You should be able to run: npm run dev");
} else {
  console.log("❌ Some environment variables need attention");
  console.log("\n📋 Next Steps:");
  console.log("1. Update .env.local with your actual Convex deployment URL");
  console.log("2. Get your Convex URL from: https://dashboard.convex.dev");
  console.log("3. Set up Google OAuth credentials if needed");
  console.log("4. Run this script again to verify");
}

console.log(
  '\n💡 Tip: You can also run "npm run debug-dashboard" to see runtime environment status',
);
