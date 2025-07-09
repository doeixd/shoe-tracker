import "@testing-library/jest-dom";
import { expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock("import.meta", () => ({
  env: {
    VITE_CONVEX_URL: "https://test.convex.cloud",
    NODE_ENV: "test",
  },
}));

// Mock Convex client and auth
vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("@convex-dev/auth/react", () => ({
  ConvexAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthActions: () => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@convex-dev/react-query", () => ({
  ConvexQueryClient: vi.fn(() => ({
    hashFn: () => () => "test-hash",
    queryFn: () => () => Promise.resolve({}),
    connect: vi.fn(),
    convexClient: {},
  })),
  convexQuery: vi.fn(),
  useConvexMutation: vi.fn(),
}));

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  createRouter: vi.fn(),
  createFileRoute: vi.fn(),
  createLazyFileRoute: vi.fn(),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ state: { location: { pathname: "/" } } }),
  useSearch: () => ({}),
  Link: ({ children, ...props }: any) => {
    return React.createElement("a", props, children);
  },
  Outlet: () => {
    return React.createElement("div", { "data-testid": "outlet" });
  },
  redirect: vi.fn(),
}));

// Mock window.matchMedia for responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for viewport-based components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// jest-dom matchers are imported and automatically available
// No need to explicitly extend expect with vitest and jest-dom setup

// Global test utilities
export const createMockUser = () => ({
  id: "test-user-id",
  name: "Test User",
  email: "test@example.com",
});

export const createMockCollection = (overrides = {}) => ({
  id: "test-collection-id",
  name: "Test Collection",
  description: "Test Description",
  color: "#3B82F6",
  isArchived: false,
  ...overrides,
});

export const createMockShoe = (overrides = {}) => ({
  id: "test-shoe-id",
  name: "Test Shoe",
  model: "Test Model",
  brand: "Test Brand",
  collectionId: "test-collection-id",
  maxMileage: 500,
  currentMileage: 100,
  isRetired: false,
  ...overrides,
});

export const createMockRun = (overrides = {}) => ({
  id: "test-run-id",
  date: "2024-01-01",
  distance: 5.0,
  duration: 30,
  shoeId: "test-shoe-id",
  runType: "easy" as const,
  ...overrides,
});

export const createMockDashboardData = () => ({
  stats: {
    totalCollections: 2,
    totalShoes: 3,
    activeShoes: 2,
    retiredShoes: 1,
    totalRuns: 10,
    totalDistance: 50.0,
    totalDuration: 300,
    avgDistance: 5.0,
    monthlyRuns: 5,
    monthlyDistance: 25.0,
    shoesNeedingReplacement: 0,
  },
  collections: [createMockCollection()],
  shoes: [createMockShoe()],
  recentRuns: [createMockRun()],
  shoesNeedingReplacement: [],
});

// Silence console errors in tests unless explicitly needed
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
