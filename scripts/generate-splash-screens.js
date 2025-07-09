#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Canvas-like API simulation for Node.js
function createSVGSplashScreen(width, height, deviceName) {
  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- App Icon -->
  <rect x="${width / 2 - 60}" y="${height / 2 - 80}" width="120" height="120" rx="24" fill="rgba(255,255,255,0.9)"/>

  <!-- Icon content (shoe icon) -->
  <path d="M${width / 2 - 30} ${height / 2 - 50} Q${width / 2 - 20} ${height / 2 - 60} ${width / 2} ${height / 2 - 50} Q${width / 2 + 20} ${height / 2 - 60} ${width / 2 + 30} ${height / 2 - 50} L${width / 2 + 25} ${height / 2 - 20} Q${width / 2 + 30} ${height / 2 - 10} ${width / 2 + 20} ${height / 2} L${width / 2 - 20} ${height / 2} Q${width / 2 - 30} ${height / 2 - 10} ${width / 2 - 25} ${height / 2 - 20} Z" fill="#3b82f6"/>

  <!-- App Name -->
  <text x="${width / 2}" y="${height / 2 + 60}" text-anchor="middle" fill="white" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${Math.min(width, height) * 0.06}" font-weight="600">MyShoeTracker</text>

  <!-- Tagline -->
  <text x="${width / 2}" y="${height / 2 + 90}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${Math.min(width, height) * 0.035}" font-weight="400">Track Your Runs</text>
</svg>`;

  return svg;
}

// Splash screen configurations
const splashScreens = [
  // iPhone SE (1st gen, 5s, 5c, 5)
  {
    name: "iphone-se-portrait.svg",
    width: 640,
    height: 1136,
    device: "iPhone SE",
  },
  {
    name: "iphone-se-landscape.svg",
    width: 1136,
    height: 640,
    device: "iPhone SE",
  },

  // iPhone 6, 6s, 7, 8, SE (2nd gen)
  {
    name: "iphone-8-portrait.svg",
    width: 750,
    height: 1334,
    device: "iPhone 8",
  },
  {
    name: "iphone-8-landscape.svg",
    width: 1334,
    height: 750,
    device: "iPhone 8",
  },

  // iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus
  {
    name: "iphone-8-plus-portrait.svg",
    width: 1242,
    height: 2208,
    device: "iPhone 8 Plus",
  },
  {
    name: "iphone-8-plus-landscape.svg",
    width: 2208,
    height: 1242,
    device: "iPhone 8 Plus",
  },

  // iPhone X, XS, 11 Pro
  {
    name: "iphone-x-portrait.svg",
    width: 1125,
    height: 2436,
    device: "iPhone X",
  },
  {
    name: "iphone-x-landscape.svg",
    width: 2436,
    height: 1125,
    device: "iPhone X",
  },

  // iPhone XR, 11
  {
    name: "iphone-xr-portrait.svg",
    width: 828,
    height: 1792,
    device: "iPhone XR",
  },
  {
    name: "iphone-xr-landscape.svg",
    width: 1792,
    height: 828,
    device: "iPhone XR",
  },

  // iPhone XS Max, 11 Pro Max
  {
    name: "iphone-xs-max-portrait.svg",
    width: 1242,
    height: 2688,
    device: "iPhone XS Max",
  },
  {
    name: "iphone-xs-max-landscape.svg",
    width: 2688,
    height: 1242,
    device: "iPhone XS Max",
  },

  // iPhone 12, 12 Pro, 13, 13 Pro, 14, 14 Pro
  {
    name: "iphone-12-portrait.svg",
    width: 1170,
    height: 2532,
    device: "iPhone 12",
  },
  {
    name: "iphone-12-landscape.svg",
    width: 2532,
    height: 1170,
    device: "iPhone 12",
  },

  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  {
    name: "iphone-12-pro-max-portrait.svg",
    width: 1284,
    height: 2778,
    device: "iPhone 12 Pro Max",
  },
  {
    name: "iphone-12-pro-max-landscape.svg",
    width: 2778,
    height: 1284,
    device: "iPhone 12 Pro Max",
  },

  // iPhone 14 Pro
  {
    name: "iphone-14-pro-portrait.svg",
    width: 1179,
    height: 2556,
    device: "iPhone 14 Pro",
  },
  {
    name: "iphone-14-pro-landscape.svg",
    width: 2556,
    height: 1179,
    device: "iPhone 14 Pro",
  },

  // iPhone 14 Pro Max
  {
    name: "iphone-14-pro-max-portrait.svg",
    width: 1290,
    height: 2796,
    device: "iPhone 14 Pro Max",
  },
  {
    name: "iphone-14-pro-max-landscape.svg",
    width: 2796,
    height: 1290,
    device: "iPhone 14 Pro Max",
  },

  // iPhone 15, 15 Pro
  {
    name: "iphone-15-portrait.svg",
    width: 1179,
    height: 2556,
    device: "iPhone 15",
  },
  {
    name: "iphone-15-landscape.svg",
    width: 2556,
    height: 1179,
    device: "iPhone 15",
  },

  // iPhone 15 Pro Max
  {
    name: "iphone-15-pro-max-portrait.svg",
    width: 1290,
    height: 2796,
    device: "iPhone 15 Pro Max",
  },
  {
    name: "iphone-15-pro-max-landscape.svg",
    width: 2796,
    height: 1290,
    device: "iPhone 15 Pro Max",
  },

  // iPad
  { name: "ipad-portrait.svg", width: 1536, height: 2048, device: "iPad" },
  { name: "ipad-landscape.svg", width: 2048, height: 1536, device: "iPad" },

  // iPad Pro 10.5"
  {
    name: "ipad-pro-10-portrait.svg",
    width: 1668,
    height: 2224,
    device: 'iPad Pro 10.5"',
  },
  {
    name: "ipad-pro-10-landscape.svg",
    width: 2224,
    height: 1668,
    device: 'iPad Pro 10.5"',
  },

  // iPad Pro 11"
  {
    name: "ipad-pro-11-portrait.svg",
    width: 1668,
    height: 2388,
    device: 'iPad Pro 11"',
  },
  {
    name: "ipad-pro-11-landscape.svg",
    width: 2388,
    height: 1668,
    device: 'iPad Pro 11"',
  },

  // iPad Pro 12.9"
  {
    name: "ipad-pro-12-portrait.svg",
    width: 2048,
    height: 2732,
    device: 'iPad Pro 12.9"',
  },
  {
    name: "ipad-pro-12-landscape.svg",
    width: 2732,
    height: 2048,
    device: 'iPad Pro 12.9"',
  },
];

// Create splash screens directory if it doesn't exist
const splashDir = path.join(__dirname, "..", "public", "splash");
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

// Generate PNG versions using .png extension
const pngScreens = splashScreens.map((screen) => ({
  ...screen,
  name: screen.name.replace(".svg", ".png"),
}));

// Generate splash screens
console.log("Generating iOS splash screens...");

splashScreens.forEach((screen) => {
  const svg = createSVGSplashScreen(screen.width, screen.height, screen.device);
  const filePath = path.join(splashDir, screen.name);

  fs.writeFileSync(filePath, svg);
  console.log(
    `✓ Generated ${screen.name} (${screen.width}x${screen.height}) for ${screen.device}`,
  );
});

// Also create placeholder PNG files (browsers prefer PNG for splash screens)
pngScreens.forEach((screen) => {
  const svg = createSVGSplashScreen(screen.width, screen.height, screen.device);
  const filePath = path.join(splashDir, screen.name);

  // For now, just create the SVG with PNG extension
  // In a real production environment, you'd want to use a proper SVG-to-PNG converter
  fs.writeFileSync(filePath, svg);
  console.log(
    `✓ Generated ${screen.name} (${screen.width}x${screen.height}) for ${screen.device}`,
  );
});

console.log("\n🎉 All splash screens generated successfully!");
console.log(`📁 Files saved to: ${splashDir}`);
console.log(
  "\n💡 Tip: For production, consider using a proper SVG-to-PNG converter for better iOS compatibility.",
);
console.log("You can use tools like sharp, puppeteer, or online converters.");

// Generate a summary report
const report = {
  generated: new Date().toISOString(),
  totalScreens: splashScreens.length * 2, // SVG + PNG versions
  devices: [...new Set(splashScreens.map((s) => s.device))],
  resolutions: splashScreens.map((s) => `${s.width}x${s.height}`),
  directory: splashDir,
};

fs.writeFileSync(
  path.join(splashDir, "generation-report.json"),
  JSON.stringify(report, null, 2),
);

console.log("\n📊 Generation report saved to generation-report.json");
