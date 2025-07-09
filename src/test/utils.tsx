import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// Create a test query client with no retries and short cache times
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Test wrapper component that provides all necessary context
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function TestWrapper({ children, queryClient }: TestWrapperProps) {
  const client = queryClient || createTestQueryClient();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) {
  const { queryClient, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <TestWrapper queryClient={queryClient}>{children}</TestWrapper>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock query hooks for testing
export const mockQueries = {
  useDashboardData: vi.fn(),
  useCollections: vi.fn(),
  useShoes: vi.fn(),
  useRuns: vi.fn(),
  useOverallStats: vi.fn(),
};

// Helper to setup successful query mocks
export function setupSuccessfulQueryMocks(data: any = {}) {
  const defaultData = {
    collections: [],
    shoes: [],
    runs: [],
    stats: {
      totalCollections: 0,
      totalShoes: 0,
      activeShoes: 0,
      retiredShoes: 0,
      totalRuns: 0,
      totalDistance: 0,
      totalDuration: 0,
      avgDistance: 0,
      monthlyRuns: 0,
      monthlyDistance: 0,
      shoesNeedingReplacement: 0,
    },
    shoesNeedingReplacement: [],
    recentRuns: [],
    ...data,
  };

  mockQueries.useDashboardData.mockReturnValue({
    data: defaultData,
    isLoading: false,
    error: null,
    isSuccess: true,
  });

  mockQueries.useCollections.mockReturnValue({
    data: defaultData.collections,
    isLoading: false,
    error: null,
    isSuccess: true,
  });

  mockQueries.useShoes.mockReturnValue({
    data: defaultData.shoes,
    isLoading: false,
    error: null,
    isSuccess: true,
  });

  mockQueries.useRuns.mockReturnValue({
    data: defaultData.runs,
    isLoading: false,
    error: null,
    isSuccess: true,
  });

  mockQueries.useOverallStats.mockReturnValue({
    data: defaultData.stats,
    isLoading: false,
    error: null,
    isSuccess: true,
  });
}

// Helper to setup loading query mocks
export function setupLoadingQueryMocks() {
  Object.values(mockQueries).forEach((mock) => {
    mock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
    });
  });
}

// Helper to setup error query mocks
export function setupErrorQueryMocks(error = new Error("Test error")) {
  Object.values(mockQueries).forEach((mock) => {
    mock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      isSuccess: false,
    });
  });
}

// Mock authentication hook
export const mockUseAuth = vi.fn();

export function setupAuthMock(authState = {}) {
  const defaultAuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...authState,
  };

  mockUseAuth.mockReturnValue(defaultAuthState);
}

// Wait for async operations to complete
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Common test data factories
export const testData = {
  user: {
    id: "test-user-1",
    name: "Test User",
    email: "test@example.com",
  },

  collection: {
    id: "collection-1",
    name: "Road Running",
    description: "Shoes for road running",
    color: "#3B82F6",
    isArchived: false,
  },

  shoe: {
    id: "shoe-1",
    name: "Nike Air Zoom Pegasus",
    model: "Air Zoom Pegasus 40",
    brand: "Nike",
    collectionId: "collection-1",
    maxMileage: 500,
    currentMileage: 150,
    isRetired: false,
    purchaseDate: "2024-01-01",
    purchasePrice: 130,
  },

  run: {
    id: "run-1",
    date: "2024-01-15",
    distance: 5.2,
    duration: 30,
    pace: "5:45",
    shoeId: "shoe-1",
    runType: "easy" as const,
    surface: "road" as const,
    effort: "easy" as const,
  },

  dashboardData: {
    stats: {
      totalCollections: 2,
      totalShoes: 3,
      activeShoes: 2,
      retiredShoes: 1,
      totalRuns: 15,
      totalDistance: 75.5,
      totalDuration: 450,
      avgDistance: 5.03,
      monthlyRuns: 8,
      monthlyDistance: 40.2,
      shoesNeedingReplacement: 1,
    },
    collections: [],
    shoes: [],
    recentRuns: [],
    shoesNeedingReplacement: [],
  },
};

// Helper to create variations of test data
export function createTestCollection(overrides = {}) {
  return { ...testData.collection, ...overrides };
}

export function createTestShoe(overrides = {}) {
  return { ...testData.shoe, ...overrides };
}

export function createTestRun(overrides = {}) {
  return { ...testData.run, ...overrides };
}

export function createTestDashboardData(overrides = {}) {
  return { ...testData.dashboardData, ...overrides };
}

// Mock window methods that might be used in components
export function mockWindowMethods() {
  Object.defineProperty(window, "scrollTo", {
    value: vi.fn(),
    writable: true,
  });

  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  Object.defineProperty(navigator, "onLine", {
    value: true,
    writable: true,
  });
}

// Reset all mocks between tests
export function resetAllMocks() {
  vi.clearAllMocks();
  Object.values(mockQueries).forEach((mock) => mock.mockReset());
  mockUseAuth.mockReset();
}
