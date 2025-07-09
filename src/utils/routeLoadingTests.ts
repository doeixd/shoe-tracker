import { QueryClient } from "@tanstack/react-query";
import { createOptimizedLoader, RoutePerformance, LOADING_DELAYS } from "./routeLoading";

// Mock data for testing
const mockCollections = [
  {
    id: "1",
    name: "Running Shoes",
    description: "Daily running shoes",
    color: "#3b82f6",
    isArchived: false,
  },
  {
    id: "2",
    name: "Racing Shoes",
    description: "Competition shoes",
    color: "#ef4444",
    isArchived: false,
  },
];

const mockShoes = [
  {
    id: "1",
    name: "Nike Air Zoom Pegasus 40",
    brand: "Nike",
    model: "Air Zoom Pegasus 40",
    collectionId: "1",
    currentMileage: 250,
    maxMileage: 500,
    isRetired: false,
    imageUrl: null,
  },
  {
    id: "2",
    name: "Adidas Adizero Boston 12",
    brand: "Adidas",
    model: "Adizero Boston 12",
    collectionId: "2",
    currentMileage: 150,
    maxMileage: 400,
    isRetired: false,
    imageUrl: null,
  },
];

const mockRuns = [
  {
    id: "1",
    shoeId: "1",
    distance: 5.2,
    duration: 1800,
    date: new Date().toISOString(),
    notes: "Great morning run",
  },
  {
    id: "2",
    shoeId: "2",
    distance: 10.5,
    duration: 3000,
    date: new Date().toISOString(),
    notes: "Long run",
  },
];

// Mock query functions
const mockQueries = {
  collections: {
    list: () => Promise.resolve(mockCollections),
    archived: () => Promise.resolve([]),
    detail: (id: string) =>
      Promise.resolve(mockCollections.find(c => c.id === id)),
  },
  shoes: {
    list: (includeRetired: boolean) =>
      Promise.resolve(includeRetired ? mockShoes : mockShoes.filter(s => !s.isRetired)),
    byCollection: (collectionId: string, includeRetired: boolean) =>
      Promise.resolve(
        mockShoes.filter(s =>
          s.collectionId === collectionId &&
          (includeRetired || !s.isRetired)
        )
      ),
    detail: (id: string) =>
      Promise.resolve(mockShoes.find(s => s.id === id)),
    withStats: (id: string) => {
      const shoe = mockShoes.find(s => s.id === id);
      return Promise.resolve(shoe ? { ...shoe, stats: { totalRuns: 5 } } : null);
    },
  },
  runs: {
    list: (limit: number, shoeId?: string) =>
      Promise.resolve(
        mockRuns
          .filter(r => !shoeId || r.shoeId === shoeId)
          .slice(0, limit)
      ),
    withShoes: (limit: number) =>
      Promise.resolve(
        mockRuns
          .map(r => ({ ...r, shoe: mockShoes.find(s => s.id === r.shoeId) }))
          .slice(0, limit)
      ),
  },
  stats: {
    overall: () => Promise.resolve({
      totalShoes: mockShoes.length,
      totalRuns: mockRuns.length,
      totalDistance: mockRuns.reduce((sum, r) => sum + r.distance, 0),
      totalDuration: mockRuns.reduce((sum, r) => sum + r.duration, 0),
    }),
  },
};

// Test utilities
export class RouteLoadingTester {
  private queryClient: QueryClient;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });
  }

  // Test loading delays
  async testLoadingDelays() {
    const testName = "loading-delays";
    console.log(`🧪 Testing ${testName}...`);

    const start = performance.now();

    // Test that delays are within expected ranges
    const delays = Object.values(LOADING_DELAYS);
    const maxDelay = Math.max(...delays);
    const minDelay = Math.min(...delays);

    const results = {
      maxDelay,
      minDelay,
      delays: LOADING_DELAYS,
      passed: maxDelay <= 1500 && minDelay >= 100, // Reasonable bounds
    };

    const duration = performance.now() - start;

    this.testResults.set(testName, {
      ...results,
      duration,
      passed: results.passed,
    });

    console.log(`✅ ${testName} completed in ${duration.toFixed(2)}ms`);
    return results;
  }

  // Test optimized loader performance
  async testOptimizedLoader() {
    const testName = "optimized-loader";
    console.log(`🧪 Testing ${testName}...`);

    const start = performance.now();

    try {
      // Test collections loader
      const collectionsResult = await createOptimizedLoader({
        queryClient: this.queryClient,
        queries: [
          {
            queryKey: ["collections"],
            queryFn: mockQueries.collections.list,
            critical: true,
          },
          {
            queryKey: ["shoes"],
            queryFn: () => mockQueries.shoes.list(false),
            critical: true,
          },
        ],
        prefetchQueries: [
          {
            queryKey: ["runs"],
            queryFn: () => mockQueries.runs.withShoes(10),
          },
        ],
      });

      const duration = performance.now() - start;

      const results = {
        success: true,
        data: collectionsResult,
        duration,
        passed: duration < 1000, // Should complete within 1 second
      };

      this.testResults.set(testName, results);
      console.log(`✅ ${testName} completed in ${duration.toFixed(2)}ms`);
      return results;
    } catch (error) {
      const duration = performance.now() - start;

      const results = {
        success: false,
        error: error.message,
        duration,
        passed: false,
      };

      this.testResults.set(testName, results);
      console.log(`❌ ${testName} failed in ${duration.toFixed(2)}ms: ${error.message}`);
      return results;
    }
  }

  // Test route performance monitoring
  async testPerformanceMonitoring() {
    const testName = "performance-monitoring";
    console.log(`🧪 Testing ${testName}...`);

    const routeName = "test-route";
    const start = performance.now();

    // Start monitoring
    RoutePerformance.start(routeName);

    // Simulate route loading
    await new Promise(resolve => setTimeout(resolve, 100));

    // End monitoring
    RoutePerformance.end(routeName);

    // Measure
    const measurement = RoutePerformance.measure(routeName);

    const duration = performance.now() - start;

    const results = {
      measurement,
      duration,
      passed: measurement !== null && measurement > 0,
    };

    this.testResults.set(testName, results);

    if (results.passed) {
      console.log(`✅ ${testName} completed - measured ${measurement?.toFixed(2)}ms`);
    } else {
      console.log(`❌ ${testName} failed - no measurement captured`);
    }

    return results;
  }

  // Test error handling
  async testErrorHandling() {
    const testName = "error-handling";
    console.log(`🧪 Testing ${testName}...`);

    const start = performance.now();

    try {
      // Test with auth error
      await createOptimizedLoader({
        queryClient: this.queryClient,
        queries: [
          {
            queryKey: ["auth-error"],
            queryFn: () => Promise.reject(new Error("not authenticated")),
            critical: true,
          },
        ],
      });

      const duration = performance.now() - start;

      const results = {
        authErrorHandled: true,
        duration,
        passed: true,
      };

      this.testResults.set(testName, results);
      console.log(`✅ ${testName} completed - auth error handled gracefully`);
      return results;
    } catch (error) {
      const duration = performance.now() - start;

      const results = {
        authErrorHandled: false,
        error: error.message,
        duration,
        passed: false,
      };

      this.testResults.set(testName, results);
      console.log(`❌ ${testName} failed - auth error not handled: ${error.message}`);
      return results;
    }
  }

  // Test query cache behavior
  async testQueryCache() {
    const testName = "query-cache";
    console.log(`🧪 Testing ${testName}...`);

    const start = performance.now();

    // First request
    const firstResult = await this.queryClient.ensureQueryData({
      queryKey: ["test-cache"],
      queryFn: mockQueries.collections.list,
      staleTime: 5 * 60 * 1000,
    });

    // Second request (should be cached)
    const secondStart = performance.now();
    const secondResult = await this.queryClient.ensureQueryData({
      queryKey: ["test-cache"],
      queryFn: mockQueries.collections.list,
      staleTime: 5 * 60 * 1000,
    });
    const secondDuration = performance.now() - secondStart;

    const totalDuration = performance.now() - start;

    const results = {
      firstRequest: firstResult,
      secondRequest: secondResult,
      secondRequestDuration: secondDuration,
      totalDuration,
      cached: secondDuration < 10, // Should be near-instant if cached
      passed: secondDuration < 10,
    };

    this.testResults.set(testName, results);

    if (results.passed) {
      console.log(`✅ ${testName} completed - cache working (${secondDuration.toFixed(2)}ms)`);
    } else {
      console.log(`❌ ${testName} failed - cache not working (${secondDuration.toFixed(2)}ms)`);
    }

    return results;
  }

  // Run all tests
  async runAllTests() {
    console.log("🚀 Starting route loading performance tests...\n");

    const testResults = await Promise.all([
      this.testLoadingDelays(),
      this.testOptimizedLoader(),
      this.testPerformanceMonitoring(),
      this.testErrorHandling(),
      this.testQueryCache(),
    ]);

    const summary = {
      totalTests: testResults.length,
      passed: testResults.filter(r => r.passed).length,
      failed: testResults.filter(r => !r.passed).length,
      results: Object.fromEntries(this.testResults),
    };

    console.log("\n📊 Test Summary:");
    console.log(`Total: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Success Rate: ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%`);

    if (summary.failed > 0) {
      console.log("\n❌ Failed tests:");
      Object.entries(summary.results).forEach(([name, result]) => {
        if (!result.passed) {
          console.log(`  - ${name}: ${result.error || "Test failed"}`);
        }
      });
    }

    return summary;
  }

  // Performance benchmarks
  async runBenchmarks() {
    console.log("🏁 Running performance benchmarks...\n");

    const benchmarks = {
      routeLoadTime: await this.benchmarkRouteLoad(),
      queryExecutionTime: await this.benchmarkQueryExecution(),
      cacheHitRate: await this.benchmarkCacheHitRate(),
    };

    console.log("\n📈 Benchmark Results:");
    Object.entries(benchmarks).forEach(([name, result]) => {
      console.log(`${name}: ${JSON.stringify(result, null, 2)}`);
    });

    return benchmarks;
  }

  private async benchmarkRouteLoad() {
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      await createOptimizedLoader({
        queryClient: this.queryClient,
        queries: [
          {
            queryKey: [`benchmark-${i}`],
            queryFn: mockQueries.collections.list,
            critical: true,
          },
        ],
      });

      times.push(performance.now() - start);
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      iterations,
    };
  }

  private async benchmarkQueryExecution() {
    const queries = [
      mockQueries.collections.list,
      () => mockQueries.shoes.list(false),
      () => mockQueries.runs.withShoes(10),
    ];

    const results = [];

    for (const query of queries) {
      const start = performance.now();
      await query();
      const duration = performance.now() - start;
      results.push(duration);
    }

    return {
      individual: results,
      average: results.reduce((a, b) => a + b, 0) / results.length,
      total: results.reduce((a, b) => a + b, 0),
    };
  }

  private async benchmarkCacheHitRate() {
    const key = "cache-benchmark";
    const iterations = 20;
    let cacheHits = 0;

    // Prime the cache
    await this.queryClient.ensureQueryData({
      queryKey: [key],
      queryFn: mockQueries.collections.list,
      staleTime: 60 * 1000,
    });

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.queryClient.ensureQueryData({
        queryKey: [key],
        queryFn: mockQueries.collections.list,
        staleTime: 60 * 1000,
      });
      const duration = performance.now() - start;

      if (duration < 1) { // Assume cache hit if < 1ms
        cacheHits++;
      }
    }

    return {
      hitRate: (cacheHits / iterations) * 100,
      hits: cacheHits,
      misses: iterations - cacheHits,
      iterations,
    };
  }
}

// Export test runner
export const testRouteLoading = async () => {
  const tester = new RouteLoadingTester();
  const results = await tester.runAllTests();
  return results;
};

// Export benchmark runner
export const benchmarkRouteLoading = async () => {
  const tester = new RouteLoadingTester();
  const results = await tester.runBenchmarks();
  return results;
};

// Utility for testing in development
export const runDevTests = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log("🔧 Running development route loading tests...");
    const testResults = await testRouteLoading();
    const benchmarkResults = await benchmarkRouteLoading();

    return {
      tests: testResults,
      benchmarks: benchmarkResults,
    };
  }
};
