import { QueryClient } from "@tanstack/react-query";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "../queries";

export interface PrefetchOptions {
  priority?: "high" | "medium" | "low";
  delay?: number;
  background?: boolean;
  requireAuth?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
}

export class IntelligentPrefetcher {
  private queryClient: QueryClient;
  private prefetchQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private userInteractions: Map<string, number> = new Map();
  private lastVisitedRoutes: string[] = [];
  private authState: AuthState = { isAuthenticated: false, isLoading: true };
  private authStateCache: { timestamp: number; state: AuthState } | null = null;
  private authStateListeners: Set<(state: AuthState) => void> = new Set();
  private cleanupFunctions: (() => void)[] = [];

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupUserBehaviorTracking();
    this.setupAuthStateTracking();
  }

  // Auth state management
  public updateAuthState(newState: AuthState) {
    const previousState = this.authState;
    this.authState = newState;
    this.authStateCache = {
      timestamp: Date.now(),
      state: newState,
    };

    // Notify listeners
    this.authStateListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (error) {
        console.error("Auth state listener error:", error);
      }
    });

    // Handle auth state transitions
    if (previousState.isAuthenticated && !newState.isAuthenticated) {
      // User logged out - clear everything
      this.handleLogout();
    } else if (!previousState.isAuthenticated && newState.isAuthenticated) {
      // User logged in - start prefetching
      this.handleLogin();
    }
  }

  private setupAuthStateTracking() {
    // Listen for auth state changes from the AuthProvider
    if (typeof window !== "undefined") {
      const handleAuthChange = (event: CustomEvent) => {
        this.updateAuthState(event.detail);
      };

      window.addEventListener(
        "auth-state-change",
        handleAuthChange as EventListener,
      );
      this.cleanupFunctions.push(() => {
        window.removeEventListener(
          "auth-state-change",
          handleAuthChange as EventListener,
        );
      });
    }
  }

  private handleLogout() {
    // Clear prefetch queue
    this.prefetchQueue = [];
    this.isProcessing = false;

    // Clear user behavior data
    this.userInteractions.clear();
    this.lastVisitedRoutes = [];

    // Clear auth-dependent cached data
    this.queryClient.removeQueries({
      predicate: (query) => {
        // Remove queries that require authentication
        const queryKey = query.queryKey;
        return (
          Array.isArray(queryKey) &&
          queryKey.some(
            (key) =>
              typeof key === "string" &&
              (key.includes("shoes") ||
                key.includes("collections") ||
                key.includes("runs") ||
                key.includes("stats")),
          )
        );
      },
    });
  }

  private handleLogin() {
    // Start aggressive prefetching after login
    setTimeout(() => {
      this.prefetchCriticalData({
        background: true,
        delay: 100,
        requireAuth: true,
      });
    }, 200);
  }

  private isAuthRequired(options: PrefetchOptions = {}): boolean {
    return options.requireAuth !== false; // Default to true for this app
  }

  public canPrefetch(options: PrefetchOptions = {}): boolean {
    // Always allow prefetching if auth is not required
    if (!this.isAuthRequired(options)) {
      return true;
    }

    // Check if we have fresh auth state
    if (
      this.authStateCache &&
      Date.now() - this.authStateCache.timestamp < 30000
    ) {
      return (
        this.authStateCache.state.isAuthenticated &&
        !this.authStateCache.state.isLoading
      );
    }

    // Fall back to current auth state
    return this.authState.isAuthenticated && !this.authState.isLoading;
  }

  private setupUserBehaviorTracking() {
    if (typeof window === "undefined") return;

    // Track route visits
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const trackRouteVisit = (url: string) => {
      if (this.canPrefetch()) {
        this.trackRouteVisit(url);
      }
    };

    history.pushState = function (state, title, url) {
      trackRouteVisit(url?.toString() || "");
      return originalPushState.apply(history, [state, title, url]);
    };

    history.replaceState = function (state, title, url) {
      trackRouteVisit(url?.toString() || "");
      return originalReplaceState.apply(history, [state, title, url]);
    };

    // Track user interactions with elements
    const handleInteraction = (e: Event) => {
      if (!this.canPrefetch()) return;

      const target = e.target as HTMLElement;
      const href = target.closest("a")?.getAttribute("href");
      if (href) {
        this.trackInteraction(href);
      }
    };

    document.addEventListener("click", handleInteraction, { passive: true });

    this.cleanupFunctions.push(() => {
      document.removeEventListener("click", handleInteraction);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });
  }

  private trackRouteVisit(route: string) {
    this.lastVisitedRoutes.unshift(route);
    if (this.lastVisitedRoutes.length > 10) {
      this.lastVisitedRoutes = this.lastVisitedRoutes.slice(0, 10);
    }
  }

  private trackInteraction(route: string) {
    const count = this.userInteractions.get(route) || 0;
    this.userInteractions.set(route, count + 1);
  }

  // Public API methods - all now auth-aware

  async prefetchCriticalData(options: PrefetchOptions = {}) {
    if (!this.canPrefetch(options)) {
      return;
    }

    const { delay = 0, background = true } = options;

    const prefetchTasks = [
      () => this.queryClient.prefetchQuery(collectionQueries.list()),
      () => this.queryClient.prefetchQuery(shoeQueries.list(false)),
      () => this.queryClient.prefetchQuery(runQueries.withShoes(50)),
      () => this.queryClient.prefetchQuery(statsQueries.overall()),
    ];

    if (background) {
      this.addToPrefetchQueue(prefetchTasks, delay);
    } else {
      await this.executePrefetchTasks(prefetchTasks, delay);
    }
  }

  async prefetchForRoute(pathname: string, options: PrefetchOptions = {}) {
    if (!this.canPrefetch(options)) {
      return;
    }

    const { delay = 0, background = true } = options;
    const tasks: Array<() => Promise<void>> = [];

    if (pathname.startsWith("/shoes")) {
      tasks.push(
        () => this.queryClient.prefetchQuery(shoeQueries.list(false)),
        () => this.queryClient.prefetchQuery(shoeQueries.list(true)),
        () => this.queryClient.prefetchQuery(collectionQueries.list()),
      );

      // If it's a specific shoe route
      const shoeMatch = pathname.match(/\/shoes\/([^\/]+)/);
      if (shoeMatch && shoeMatch[1] !== "new") {
        const shoeId = shoeMatch[1];
        tasks.push(
          () => this.queryClient.prefetchQuery(shoeQueries.detail(shoeId)),
          () => this.queryClient.prefetchQuery(shoeQueries.withStats(shoeId)),
          () => this.queryClient.prefetchQuery(runQueries.list(50, shoeId)),
        );
      }
    } else if (pathname.startsWith("/runs")) {
      tasks.push(
        () => this.queryClient.prefetchQuery(runQueries.withShoes(100)),
        () => this.queryClient.prefetchQuery(shoeQueries.list(false)),
      );

      // If it's a specific run route
      const runMatch = pathname.match(/\/runs\/([^\/]+)/);
      if (runMatch && runMatch[1] !== "new") {
        const runId = runMatch[1];
        tasks.push(() =>
          this.queryClient.prefetchQuery(runQueries.detail(runId)),
        );
      }
    } else if (pathname.startsWith("/collections")) {
      tasks.push(
        () => this.queryClient.prefetchQuery(collectionQueries.list()),
        () => this.queryClient.prefetchQuery(collectionQueries.archived()),
        () => this.queryClient.prefetchQuery(shoeQueries.list(false)),
      );

      // If it's a specific collection route
      const collectionMatch = pathname.match(/\/collections\/([^\/]+)/);
      if (collectionMatch && collectionMatch[1] !== "new") {
        const collectionId = collectionMatch[1];
        tasks.push(
          () =>
            this.queryClient.prefetchQuery(
              collectionQueries.detail(collectionId),
            ),
          () =>
            this.queryClient.prefetchQuery(
              shoeQueries.byCollection(collectionId, false),
            ),
          () =>
            this.queryClient.prefetchQuery(
              shoeQueries.byCollection(collectionId, true),
            ),
        );
      }
    } else if (pathname === "/analytics") {
      tasks.push(
        () => this.queryClient.prefetchQuery(statsQueries.overall()),
        () => this.queryClient.prefetchQuery(runQueries.withShoes(200)),
      );
    } else if (pathname === "/profile") {
      tasks.push(
        () => this.queryClient.prefetchQuery(statsQueries.overall()),
        () => this.queryClient.prefetchQuery(collectionQueries.list()),
      );
    }

    if (background) {
      this.addToPrefetchQueue(tasks, delay);
    } else {
      await this.executePrefetchTasks(tasks, delay);
    }
  }

  async prefetchBasedOnBehavior(options: PrefetchOptions = {}) {
    if (!this.canPrefetch(options)) {
      return;
    }

    const { delay = 0, background = true } = options;
    const tasks: Array<() => Promise<void>> = [];

    // Prefetch data for frequently visited routes
    const sortedInteractions = Array.from(this.userInteractions.entries()).sort(
      ([, a], [, b]) => b - a,
    );

    for (const [route, count] of sortedInteractions.slice(0, 3)) {
      if (count > 2) {
        // Only prefetch if user has interacted multiple times
        if (route.includes("/shoes/")) {
          const shoeId = route.split("/shoes/")[1]?.split("/")[0];
          if (shoeId && shoeId !== "new") {
            tasks.push(
              () => this.queryClient.prefetchQuery(shoeQueries.detail(shoeId)),
              () =>
                this.queryClient.prefetchQuery(shoeQueries.withStats(shoeId)),
            );
          }
        }
      }
    }

    // Prefetch related data based on last visited routes
    for (const route of this.lastVisitedRoutes.slice(0, 3)) {
      if (route.includes("/runs") && !route.includes("/runs/")) {
        tasks.push(() =>
          this.queryClient.prefetchQuery(shoeQueries.list(false)),
        );
      }
    }

    if (background) {
      this.addToPrefetchQueue(tasks, delay);
    } else {
      await this.executePrefetchTasks(tasks, delay);
    }
  }

  // Prefetch on user interactions (hover, focus, touch)
  prefetchOnInteraction(
    element: HTMLElement,
    route: string,
    options: PrefetchOptions = {},
  ) {
    const prefetchHandler = () => {
      if (this.canPrefetch(options)) {
        this.prefetchForRoute(route, {
          background: true,
          delay: 0,
          ...options,
        });
      }
    };

    element.addEventListener("mouseenter", prefetchHandler, { passive: true });
    element.addEventListener("focusin", prefetchHandler, { passive: true });
    element.addEventListener("touchstart", prefetchHandler, { passive: true });

    // Return cleanup function
    return () => {
      element.removeEventListener("mouseenter", prefetchHandler);
      element.removeEventListener("focusin", prefetchHandler);
      element.removeEventListener("touchstart", prefetchHandler);
    };
  }

  async preloadLikelyRoutes(
    currentRoute: string,
    options: PrefetchOptions = {},
  ) {
    if (!this.canPrefetch(options)) {
      return;
    }

    const tasks: Array<() => Promise<void>> = [];

    if (currentRoute === "/" || currentRoute === "/shoes") {
      // From home/shoes, likely to go to specific shoes or runs
      tasks.push(
        () => this.queryClient.prefetchQuery(runQueries.withShoes(20)),
        () => this.queryClient.prefetchQuery(collectionQueries.list()),
      );
    } else if (
      currentRoute.startsWith("/shoes/") &&
      !currentRoute.includes("/edit")
    ) {
      // From shoe detail, likely to go to runs or edit
      tasks.push(() =>
        this.queryClient.prefetchQuery(runQueries.withShoes(20)),
      );
    } else if (currentRoute === "/runs") {
      // From runs, likely to go to specific run or add new run
      tasks.push(() => this.queryClient.prefetchQuery(shoeQueries.list(false)));
    }

    this.addToPrefetchQueue(tasks);
  }

  // Auth state listener management
  public onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.add(listener);
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  // Queue management (enhanced with auth checks)
  private addToPrefetchQueue(
    tasks: Array<() => Promise<void>>,
    delay: number = 0,
  ) {
    // Double-check auth before adding to queue
    if (!this.canPrefetch()) {
      return;
    }

    const queuedTasks = tasks.map((task) => async () => {
      // Check auth again when task executes
      if (!this.canPrefetch()) {
        return;
      }

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        await task();
      } catch (error: any) {
        // Handle auth errors specifically
        if (
          error?.message?.includes("not authenticated") ||
          error?.message?.includes("Unauthorized") ||
          error?.message?.includes("access denied")
        ) {
          // Update auth state and stop processing
          this.updateAuthState({
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }
        console.debug("Prefetch task failed:", error);
      }
    });

    this.prefetchQueue.push(...queuedTasks);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;

    this.isProcessing = true;

    const processTask = async () => {
      if (!this.canPrefetch()) {
        // Clear remaining queue if auth lost
        this.prefetchQueue = [];
        return;
      }

      const task = this.prefetchQueue.shift();
      if (task) {
        await task();
      }
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    const scheduleTask = (callback: () => void) => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: 1000 });
      } else {
        setTimeout(callback, 10);
      }
    };

    while (this.prefetchQueue.length > 0 && this.canPrefetch()) {
      await new Promise<void>((resolve) => {
        scheduleTask(async () => {
          await processTask();
          resolve();
        });
      });
    }

    this.isProcessing = false;
  }

  private async executePrefetchTasks(
    tasks: Array<() => Promise<void>>,
    delay: number = 0,
  ) {
    if (!this.canPrefetch()) {
      return;
    }

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Execute tasks in parallel with error handling
    const results = await Promise.allSettled(
      tasks.map(async (task) => {
        if (!this.canPrefetch()) {
          throw new Error("Authentication lost during prefetch");
        }
        return task();
      }),
    );

    // Check for auth errors in results
    results.forEach((result) => {
      if (result.status === "rejected") {
        const error = result.reason;
        if (
          error?.message?.includes("not authenticated") ||
          error?.message?.includes("Unauthorized") ||
          error?.message?.includes("access denied")
        ) {
          this.updateAuthState({
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    });
  }

  // Enhanced utility methods
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !this.authState.isLoading;
  }

  public reset() {
    this.prefetchQueue = [];
    this.isProcessing = false;
    this.userInteractions.clear();
    this.lastVisitedRoutes = [];
    this.authStateCache = null;
  }

  public cleanup() {
    this.reset();
    this.authStateListeners.clear();
    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
  }

  public getStats() {
    return {
      queueLength: this.prefetchQueue.length,
      isProcessing: this.isProcessing,
      interactionCount: this.userInteractions.size,
      recentRoutes: this.lastVisitedRoutes.slice(0, 5),
      authState: this.authState,
      canPrefetch: this.canPrefetch(),
    };
  }
}

// Enhanced singleton management with proper cleanup
let prefetcher: IntelligentPrefetcher | null = null;

export function createPrefetcher(queryClient: QueryClient) {
  if (prefetcher) {
    prefetcher.cleanup();
  }
  prefetcher = new IntelligentPrefetcher(queryClient);
  return prefetcher;
}

export function getPrefetcher() {
  return prefetcher;
}

// Auth-aware utility functions
export async function prefetchShoeDetails(
  queryClient: QueryClient,
  shoeId: string,
  options: PrefetchOptions = {},
) {
  const instance = getPrefetcher();
  if (!instance || !instance.canPrefetch(options)) {
    return;
  }

  await Promise.allSettled([
    queryClient.prefetchQuery(shoeQueries.detail(shoeId)),
    queryClient.prefetchQuery(shoeQueries.withStats(shoeId)),
    queryClient.prefetchQuery(runQueries.list(50, shoeId)),
  ]);
}

export async function prefetchCollectionDetails(
  queryClient: QueryClient,
  collectionId: string,
  options: PrefetchOptions = {},
) {
  const instance = getPrefetcher();
  if (!instance || !instance.canPrefetch(options)) {
    return;
  }

  await Promise.allSettled([
    queryClient.prefetchQuery(collectionQueries.detail(collectionId)),
    queryClient.prefetchQuery(shoeQueries.byCollection(collectionId, false)),
    queryClient.prefetchQuery(shoeQueries.byCollection(collectionId, true)),
  ]);
}

export async function prefetchRunDetails(
  queryClient: QueryClient,
  runId: string,
  options: PrefetchOptions = {},
) {
  const instance = getPrefetcher();
  if (!instance || !instance.canPrefetch(options)) {
    return;
  }

  await queryClient.prefetchQuery(runQueries.detail(runId));
}

// Enhanced hook with auth awareness
export function usePrefetcher() {
  const instance = getPrefetcher();

  if (!instance) {
    console.warn(
      "Prefetcher not initialized. Make sure to call createPrefetcher first.",
    );
    return null;
  }

  return {
    prefetcher: instance,
    canPrefetch: instance.canPrefetch(),
    isAuthenticated: instance.isAuthenticated(),
    authState: instance.getAuthState(),
    stats: instance.getStats(),
  };
}

// Helper for triggering auth state changes from components
export function triggerAuthStateChange(authState: AuthState) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("auth-state-change", {
      detail: authState,
    });
    window.dispatchEvent(event);
  }
}
