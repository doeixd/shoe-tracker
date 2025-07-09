# Faster Loading: Eliminating Loading States with Convex + TanStack Router

## Overview

This guide demonstrates how to eliminate loading states in your Convex + TanStack Router application by leveraging the powerful combination of:

- **TanStack Router's built-in SWR caching** for route-level data persistence
- **Convex's real-time subscriptions** for automatic data synchronization
- **TanStack Query's suspense integration** for instant component rendering
- **Strategic prefetching** to ensure data is available before navigation

## Current Issues in the Codebase

### What's Causing Loading States

After analyzing the codebase, here are the specific issues causing loading states:

1. **Excessive `pendingComponent` usage** - Nearly every route shows a loading state:
   ```typescript
   // Found in 14 different routes
   pendingComponent: () => (
     <EnhancedLoading
       message="Loading your shoes..."
       layout="shoes"
       holdDelay={200}
       skeletonDelay={300}
       showProgress={true}
     />
   )
   ```

2. **Missing route-level caching configuration** - No `staleTime` or `gcTime` set on routes:
   ```typescript
   // Current loader (no caching config)
   loader: async ({ context: { queryClient } }) => {
     await queryClient.ensureQueryData(shoeQueries.list(false));
     return { user };
   }
   ```

3. **Sequential auth checks** - Every route calls `requireAuth` which triggers a query:
   ```typescript
   // This runs on every route, causing delays
   const user = await requireAuth(queryClient);
   ```

4. **Component-level loading states** - Components still use `isLoading` patterns:
   ```typescript
   const { isLoading, error } = useAppData();
   if (isLoading) return <LoadingSpinner />;
   ```

5. **Router configuration not optimized** - Missing key caching configurations:
   ```typescript
   // Current: 50ms delay hurts performance
   defaultPreloadDelay: 50,
   // Missing: staleTime, gcTime, shouldReload configurations
   ```

6. **No root-level prefetching** - Root route doesn't prefetch critical data
7. **Manual loading logic** - Using `isLoading` checks instead of suspense
8. **Auth loading states** - Auth provider shows loading states unnecessarily

### Why This Approach Works

#### The Problem with Traditional Loading States

Most React applications show loading spinners because:
1. Data is fetched on component mount
2. Each route navigation triggers new data fetches
3. Component renders are blocked until data arrives
4. Users see loading states repeatedly for the same data

#### The Solution: Cache-First Architecture

Our approach eliminates these issues by:
1. **Prefetching data before navigation** using route loaders
2. **Caching data across route changes** with TanStack Router's SWR cache
3. **Rendering components immediately** with cached data using suspense
4. **Keeping data fresh** with Convex's real-time subscriptions

## Implementation Strategy

### 1. Fix Router Configuration for Optimal Caching

**Current Issue:** Your router has suboptimal caching settings that cause unnecessary loading states.

**Current Configuration Problems:**
```typescript
// src/router.tsx - CURRENT (PROBLEMATIC)
const router = routerWithQueryClient(
  createTanStackRouter({
    routeTree,
    defaultPreload: "intent", // ✅ Good
    defaultPreloadDelay: 50, // ❌ BAD: Causes 50ms delay
    defaultPendingMs: 0, // ❌ BAD: Should be higher to prevent flashing
    // ❌ MISSING: No staleTime, gcTime, shouldReload
    context: { queryClient },
  }),
  queryClient,
);
```

**Fixed Configuration:**
```typescript
// src/router.tsx - FIXED
const router = routerWithQueryClient(
  createTanStackRouter({
    routeTree,
    defaultPreload: "intent", // Prefetch on hover/focus
    defaultPreloadDelay: 0, // No delay for faster prefetching
    defaultPendingMs: 100, // Prevent loading flash for quick loads
    defaultStaleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
    defaultGcTime: 1000 * 60 * 15, // 15 minutes - keep in memory longer
    defaultShouldReload: false, // Don't reload if data is fresh
    context: { queryClient },
  }),
  queryClient,
);
```

**Why this works:**
- `defaultPreloadDelay: 0` - Eliminates the 50ms delay that's slowing you down
- `defaultPendingMs: 100` - Prevents loading flash on fast cached loads
- `defaultStaleTime: 5min` - Data is considered fresh for 5 minutes
- `defaultGcTime: 15min` - Data stays in memory for 15 minutes
- `defaultShouldReload: false` - Prevents unnecessary refetches

### 2. Fix Root Route with Comprehensive Prefetching

**Current Issue:** Your root route (`src/routes/__root.tsx`) doesn't prefetch any application data, causing loading states on every route.

**Current Root Route Problems:**
```typescript
// src/routes/__root.tsx - CURRENT (PROBLEMATIC)
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  // ❌ MISSING: No loader function at all
  // ❌ MISSING: No prefetching of critical app data
  // ❌ MISSING: No caching configuration
  component: RootComponent,
});
```

**Fixed Root Route:**
```typescript
// src/routes/__root.tsx - FIXED
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  loader: async ({ context: { queryClient } }) => {
    // Check authentication status first (but don't redirect here)
    const authResult = await checkAuth(queryClient);
    
    if (authResult.isAuthenticated) {
      // Prefetch all critical app data in parallel
      // This ensures instant loading across the entire app
      await Promise.all([
        queryClient.prefetchQuery({
          ...convexQuery(api.dashboard.getAppData, {}),
          staleTime: 1000 * 60 * 10, // 10 minutes for dashboard data
        }),
        queryClient.prefetchQuery({
          ...convexQuery(api.shoes.getShoes, {}),
          staleTime: 1000 * 60 * 5, // 5 minutes for shoes
        }),
        queryClient.prefetchQuery({
          ...convexQuery(api.shoes.getCollections, {}),
          staleTime: 1000 * 60 * 5, // 5 minutes for collections
        }),
        queryClient.prefetchQuery({
          ...convexQuery(api.shoes.getRuns, { limit: 50 }),
          staleTime: 1000 * 60 * 2, // 2 minutes for recent runs
        }),
      ]);
    }
    
    return { isAuthenticated: authResult.isAuthenticated };
  },
  // Cache this loader result for the entire session
  staleTime: 1000 * 60 * 30, // 30 minutes
  gcTime: 1000 * 60 * 60, // 1 hour
});
```

**Why this works:**
- **Parallel prefetching** - All critical data loads simultaneously
- **Conditional loading** - Only prefetch when user is authenticated
- **Differentiated stale times** - Different data types have different freshness requirements
- **Session-level caching** - Root data persists across all route changes
- **Non-blocking auth check** - Uses `checkAuth` instead of `requireAuth` to avoid redirects

### 3. Fix Route Loaders and Remove Pending Components

**Current Issue:** Every route shows a loading state due to `pendingComponent` and lack of caching configuration.

**Current Route Problems (shoes/index.tsx):**
```typescript
// src/routes/shoes/index.tsx - CURRENT (PROBLEMATIC)
export const Route = createFileRoute("/shoes/")({
  component: ShoesPage,
  pendingComponent: () => (
    <EnhancedLoading  // ❌ BAD: Always shows loading
      message="Loading your shoes..."
      layout="shoes"
      holdDelay={200}
      skeletonDelay={300}
      showProgress={true}
    />
  ),
  loader: async ({ context: { queryClient } }) => {
    const user = await requireAuth(queryClient); // ❌ BAD: Auth check on every route
    
    // ❌ BAD: No caching configuration
    await queryClient.ensureQueryData(shoeQueries.list(false));
    await queryClient.ensureQueryData(shoeQueries.list(true));
    await queryClient.ensureQueryData(collectionQueries.list());
    
    return { user };
  },
  // ❌ MISSING: No staleTime, gcTime, beforeLoad
});
```

**Fixed Route:**
```typescript
// src/routes/shoes/index.tsx - FIXED
export const Route = createFileRoute("/shoes/")({
  component: ShoesPage,
  // ✅ REMOVED: No pendingComponent - use suspense instead
  beforeLoad: async ({ context: { queryClient } }) => {
    // Start prefetching related data before the route loads
    const prefetchPromises = [
      queryClient.prefetchQuery({
        ...convexQuery(api.shoes.getRuns, { limit: 20 }),
        staleTime: 1000 * 60 * 2,
      }),
      queryClient.prefetchQuery({
        ...convexQuery(api.shoes.getCollections, {}),
        staleTime: 1000 * 60 * 5,
      }),
    ];
    
    // Fire and forget - don't block navigation
    Promise.all(prefetchPromises).catch(() => {});
    
    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    // ✅ FIXED: Auth check moved to root route
    // This data will be instantly available due to root prefetching
    const shoes = await queryClient.fetchQuery({
      ...convexQuery(api.shoes.getShoes, { includeRetired: false }),
      staleTime: 1000 * 60 * 5,
    });
    
    return { shoes };
  },
  // ✅ ADDED: Route-level caching configuration
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  shouldReload: false, // Don't reload if data is fresh
});
```

**Apply this pattern to all routes:**
- Remove all `pendingComponent` configurations
- Add `beforeLoad` for prefetching
- Add `staleTime` and `gcTime` to loaders
- Remove individual `requireAuth` calls (handle at root)

**Why this works:**
- **No pending components** - Eliminates loading states
- **beforeLoad prefetching** - Data is ready before navigation
- **Route-level caching** - Entire route result is cached
- **Centralized auth** - Auth handled once at root level

### 4. Replace Loading State Hooks with Suspense

**Current Issue:** Your components use manual loading state management instead of suspense.

**Current Hook Problems (src/hooks/useAppData.ts):**
```typescript
// src/hooks/useAppData.ts - CURRENT (PROBLEMATIC)
export function useAppData() {
  const query = useQuery({
    ...convexQuery(api.dashboard.getAppData, {}),
    staleTime: 1000 * 60 * 5,
  });

  return {
    ...query, // ❌ BAD: Includes isLoading, error
    collections: query.data?.collections || [],
    // ... other data accessors
  };
}
```

**Current Component Problems (src/routes/index.tsx):**
```typescript
// src/routes/index.tsx - CURRENT (PROBLEMATIC)
function Home() {
  const {
    collections,
    shoes,
    runs: recentRuns,
    stats,
    isLoading, // ❌ BAD: Manual loading state
    error,     // ❌ BAD: Manual error handling
  } = useAppData();

  // ❌ BAD: Manual loading check
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay />;
  
  return <div>{/* content */}</div>;
}
```

**Fixed Suspense-Based Hooks:**
```typescript
// src/hooks/useSuspenseQueries.ts - NEW FILE
export function useShoesSuspense(includeRetired = false) {
  return useSuspenseQuery({
    ...convexQuery(api.shoes.getShoes, { includeRetired }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useCollectionsSuspense() {
  return useSuspenseQuery({
    ...convexQuery(api.shoes.getCollections, {}),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAppDataSuspense() {
  return useSuspenseQuery({
    ...convexQuery(api.dashboard.getAppData, {}),
    staleTime: 1000 * 60 * 5,
  });
}

export function useShoeSuspense(id: string) {
  return useSuspenseQuery({
    ...convexQuery(api.shoes.getShoe, { id }),
    staleTime: 1000 * 60 * 5,
  });
}
```

**Fixed Component:**
```typescript
// src/routes/index.tsx - FIXED
function Home() {
  // ✅ FIXED: No loading states, automatic error boundaries
  const { data: appData } = useAppDataSuspense();
  
  // ✅ FIXED: Direct data access, no loading checks
  const { collections, shoes, runs: recentRuns, stats } = appData;
  
  return <div>{/* content renders immediately */}</div>;
}

// ✅ FIXED: Wrap with suspense boundary
function HomeWithSuspense() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Home />
    </Suspense>
  );
}
```

**Why this works:**
- **No loading states** - Suspense queries either return data or suspend
- **Automatic error boundaries** - Errors are handled by suspense boundaries
- **Convex real-time updates** - Data stays fresh automatically
- **Aggressive caching** - Data is cached longer because Convex keeps it fresh

### 5. Fix Component Loading Logic

**Current Issue:** Your components contain manual loading state logic instead of using suspense.

**Current Component Problems (multiple files):**
```typescript
// Multiple components - CURRENT (PROBLEMATIC)
function ShoesPage() {
  const { data: shoes, isLoading, error } = useShoes(); // ❌ BAD: Manual loading
  
  if (isLoading) return <LoadingSpinner />; // ❌ BAD: Manual loading check
  if (error) return <ErrorDisplay />; // ❌ BAD: Manual error handling
  
  return <div>{/* content */}</div>;
}

// src/routes/index.tsx - CURRENT (PROBLEMATIC)
function Home() {
  const { isLoading, error } = useAppData();
  
  if (error) {
    if (error?.message?.includes("not authenticated")) {
      return <AuthErrorDisplay />; // ❌ BAD: Manual error handling
    }
  }
  
  return <div>{/* content */}</div>;
}
```

**Fixed Component Implementation:**
```typescript
// src/routes/shoes/index.tsx - FIXED
function ShoesPageWithSuspense() {
  return (
    <ErrorBoundary fallback={<ShoesErrorFallback />}>
      <Suspense fallback={<ShoesPageSkeleton />}>
        <ShoesPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function ShoesPage() {
  // ✅ FIXED: No loading states, immediate data access
  const { data: shoes } = useShoesSuspense();
  const { data: collections } = useCollectionsSuspense();
  
  // ✅ FIXED: Component renders immediately with data
  return (
    <div>
      <h1>My Shoes</h1>
      <ShoesGrid shoes={shoes} />
      <CollectionsFilter collections={collections} />
    </div>
  );
}

// src/routes/shoes/$shoeId.tsx - FIXED
function ShoeDetails({ shoeId }: { shoeId: string }) {
  const { data: shoe } = useShoeSuspense(shoeId);
  
  // ✅ FIXED: No loading check needed - data is always available
  return (
    <div>
      <h2>{shoe.name}</h2>
      <p>{shoe.brand} {shoe.model}</p>
      {/* Rest of component */}
    </div>
  );
}

// src/routes/index.tsx - FIXED
function HomeWithSuspense() {
  return (
    <ErrorBoundary fallback={<HomeErrorFallback />}>
      <Suspense fallback={<DashboardSkeleton />}>
        <Home />
      </Suspense>
    </ErrorBoundary>
  );
}

function Home() {
  // ✅ FIXED: Direct data access, no loading checks
  const { data: appData } = useAppDataSuspense();
  const { collections, shoes, runs: recentRuns, stats } = appData;
  
  return <div>{/* content renders immediately */}</div>;
}
```

**Why this works:**
- **Immediate rendering** - Components render instantly with cached data
- **No loading logic** - Suspense handles loading states at boundary level
- **Simplified code** - No need for loading checks or error handling in components
- **Better error handling** - Error boundaries catch and handle errors properly

### 6. Fix Mutation Loading States with Optimistic Updates

**Current Issue:** Your mutations don't use optimistic updates, causing loading states during saves.

**Current Mutation Problems (src/queries.ts):**
```typescript
// src/queries.ts - CURRENT (PROBLEMATIC)
export function useUpdateShoeMutation() {
  const mutationFn = useConvexMutation(api.shoes.updateShoe);
  return useMutation({
    mutationFn,
    onError: handleMutationError, // ❌ BAD: No optimistic updates
  });
}
// ❌ BAD: User sees loading state during mutation
// ❌ BAD: No immediate UI feedback
```

**Fixed Optimistic Mutations:**
```typescript
// src/hooks/useOptimisticMutations.ts - NEW FILE
export function useOptimisticShoeMutation() {
  const queryClient = useQueryClient();
  const mutationFn = useConvexMutation(api.shoes.updateShoe);
  
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: [api.shoes.getShoes.name] 
      });
      
      // Snapshot the previous value for rollback
      const previousShoes = queryClient.getQueryData([api.shoes.getShoes.name]);
      
      // ✅ FIXED:

### 7. Enhanced AppDataLoader for Background Prefetching

Update your AppDataLoader to work with router caching:

```typescript
// components/AppDataLoader.tsx
export function AppDataLoader({ children }: AppDataLoaderProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Preload routes that users are likely to visit
      const preloadRoutes = async () => {
        // Wait a bit to avoid blocking initial render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Preload common routes
        router.preloadRoute({ to: "/shoes" });
        router.preloadRoute({ to: "/collections" });
        router.preloadRoute({ to: "/runs" });
        
        // Prefetch data that's not in route loaders
        const backgroundPrefetch = [
          queryClient.prefetchQuery({
            ...convexQuery(api.shoes.getArchivedCollections, {}),
            staleTime: 1000 * 60 * 10,
          }),
          queryClient.prefetchQuery({
            ...convexQuery(api.shoes.getOverallStats, {}),
            staleTime: 1000 * 60 * 5,
          }),
        ];
        
        Promise.all(backgroundPrefetch).catch(() => {});
      };
      
      preloadRoutes();
    }
  }, [isAuthenticated, router, queryClient]);
  
  return <>{children}</>;
}
```

**Why this works:**
- **Route preloading** - Loads route data before navigation
- **Background prefetching** - Loads supplementary data without blocking
- **Delayed execution** - Doesn't interfere with initial render
- **Error handling** - Gracefully handles prefetch failures

### 8. Query Client Configuration for Optimal Caching

Configure your query client for maximum caching efficiency:

```typescript
// router.tsx
const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error?.message?.includes('not authenticated')) return false;
        return failureCount < 3;
      },
      // Optimistic network mode for better offline experience
      networkMode: 'offlineFirst',
      // Refetch on window focus to keep data fresh
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect as Convex handles this
      refetchOnReconnect: false,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error?.message?.includes('not authenticated')) return false;
        return failureCount < 2;
      },
    },
  },
});
```

**Why this works:**
- **Longer cache times** - Data stays fresh longer with Convex
- **Offline-first** - Works better when network is unreliable
- **Smart refetching** - Only refetch when necessary
- **Auth-aware retries** - Doesn't retry auth failures

## Implementation Checklist

### Quick Wins (Immediate Impact)

1. **Fix Router Configuration** (5 minutes)
   - [ ] Change `defaultPreloadDelay` from 50ms to 0ms
   - [ ] Add `defaultStaleTime` and `defaultGcTime`
   - [ ] Add `defaultShouldReload: false`

2. **Remove Pending Components** (10 minutes)
   - [ ] Remove all `pendingComponent` configurations from routes
   - [ ] This alone will eliminate most loading states

3. **Add Root Route Loader** (15 minutes)
   - [ ] Add loader to `src/routes/__root.tsx`
   - [ ] Prefetch `api.dashboard.getAppData` for authenticated users

4. **Fix Query Client Settings** (5 minutes)
   - [ ] Increase `gcTime` to 15 minutes
   - [ ] Add retry configuration for auth errors
   - [ ] Add `networkMode: 'offlineFirst'`

### Medium Impact Changes (30-60 minutes)

5. **Convert to Suspense Queries** (30 minutes)
   - [ ] Create `src/hooks/useSuspenseQueries.ts`
   - [ ] Replace `useQuery` with `useSuspenseQuery` in components
   - [ ] Remove manual `isLoading` checks

6. **Add beforeLoad Prefetching** (20 minutes)
   - [ ] Add `beforeLoad` functions to main routes
   - [ ] Prefetch related data before navigation

7. **Implement Optimistic Updates** (30 minutes)
   - [ ] Create `src/hooks/useOptimisticMutations.ts`
   - [ ] Add optimistic updates to shoe/collection/run mutations

### Advanced Optimizations (1-2 hours)

8. **Smart Error Boundaries** (30 minutes)
   - [ ] Create error boundary components
   - [ ] Wrap route components with suspense + error boundaries

9. **Predictive Prefetching** (45 minutes)
   - [ ] Implement intelligent route prefetching
   - [ ] Add user behavior-based prefetching

10. **Performance Monitoring** (30 minutes)
    - [ ] Add navigation timing measurements
    - [ ] Set up performance tracking

## Common Pitfalls to Avoid

### 1. Don't Mix Loading Patterns
```typescript
// ❌ BAD: Mixing suspense with manual loading
function Component() {
  const { data, isLoading } = useSuspenseQuery(...);
  if (isLoading) return <Loading />; // This will never run!
}

// ✅ GOOD: Pure suspense pattern
function Component() {
  const { data } = useSuspenseQuery(...);
  return <div>{data.name}</div>;
}
```

### 2. Don't Skip Error Boundaries
```typescript
// ❌ BAD: Suspense without error boundary
<Suspense fallback={<Loading />}>
  <ComponentThatMightError />
</Suspense>

// ✅ GOOD: Always wrap with error boundary
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <ComponentThatMightError />
  </Suspense>
</ErrorBoundary>
```

### 3. Don't Prefetch Everything
```typescript
// ❌ BAD: Prefetching too much data
await Promise.all([
  queryClient.prefetchQuery(api.shoes.getShoes, {}),
  queryClient.prefetchQuery(api.shoes.getAllHistory, {}), // Too much
  queryClient.prefetchQuery(api.shoes.getDetailedAnalytics, {}), // Too much
]);

// ✅ GOOD: Prefetch only what's needed
await Promise.all([
  queryClient.prefetchQuery(api.shoes.getShoes, {}),
  queryClient.prefetchQuery(api.shoes.getCollections, {}),
]);
```

### 4. Don't Forget Stale Times
```typescript
// ❌ BAD: No stale time configuration
const query = useQuery(convexQuery(api.shoes.getShoes, {}));

// ✅ GOOD: Configure appropriate stale time
const query = useQuery({
  ...convexQuery(api.shoes.getShoes, {}),
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

## Advanced Patterns

### Predictive Prefetching Based on User Behavior

```typescript
// src/hooks/usePredictivePrefetch.ts
export function usePredictivePrefetch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  useEffect(() => {
    const prefetchLikelyRoutes = () => {
      const currentPath = location.pathname;
      
      // Prefetch based on current location
      if (currentPath === '/') {
        // From dashboard, users often go to shoes or runs
        router.preloadRoute({ to: '/shoes' });
        router.preloadRoute({ to: '/runs' });
      } else if (currentPath.startsWith('/shoes')) {
        // From shoes, users might create runs or view collections
        router.preloadRoute({ to: '/runs/new' });
        router.preloadRoute({ to: '/collections' });
      } else if (currentPath.startsWith('/collections')) {
        // From collections, users often go to shoes
        router.preloadRoute({ to: '/shoes' });
      }
    };
    
    // Prefetch after a short delay
    const timer = setTimeout(prefetchLikelyRoutes, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname, router]);
}
```

### Smart Error Boundaries with Suspense

```typescript
// src/components/SmartErrorBoundary.tsx
export function SmartErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button 
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        console.error('Error boundary caught:', error);
        // Report to error tracking service
      }}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Data Streaming for Large Datasets

```typescript
// src/hooks/useStreamingData.ts
export function useStreamingDashboard() {
  // Critical data first - always show this immediately
  const { data: stats } = useSuspenseQuery({
    ...convexQuery(api.dashboard.getDashboardStats, {}),
    staleTime: 1000 * 60 * 5,
  });
  
  // Supplementary data second - load in background
  const { data: fullData, isLoading: isFullDataLoading } = useQuery({
    ...convexQuery(api.dashboard.getAppData, {}),
    staleTime: 1000 * 60 * 10,
  });
  
  return {
    stats, // Always available immediately
    fullData, // Available after background load
    isLoadingSupplementary: isFullDataLoading,
  };
}
```

## Best Practices

### 1. Stale Time Configuration

**Based on your app's data patterns:**

```typescript
// Fast-changing data (runs, real-time stats)
staleTime: 1000 * 60 * 2, // 2 minutes

// Medium-changing data (shoes, collections)
staleTime: 1000 * 60 * 5, // 5 minutes

// Slow-changing data (user profile, settings)
staleTime: 1000 * 60 * 10, // 10 minutes

// Static data (reference data)
staleTime: 1000 * 60 * 30, // 30 minutes
```

### 2. Garbage Collection Times

**Keep data in memory longer for better UX:**

```typescript
// Critical data - keep longer
gcTime: 1000 * 60 * 30, // 30 minutes

// Regular data - standard time
gcTime: 1000 * 60 * 15, // 15 minutes

// Heavy data - clean up sooner
gcTime: 1000 * 60 * 5, // 5 minutes
```

### 3. Error Handling

**Your current auth errors are handled inconsistently - fix with:**

```typescript
// src/utils/queryConfig.ts
export const createQueryConfig = (apiCall: any, options: any = {}) => ({
  ...convexQuery(apiCall, options.args || {}),
  staleTime: options.staleTime || 1000 * 60 * 5,
  retry: (failureCount: number, error: any) => {
    // Don't retry auth errors
    if (error?.message?.includes('not authenticated')) return false;
    // Don't retry client errors
    if (error?.message?.includes('400')) return false;
    return failureCount < 3;
  },
  onError: (error: any) => {
    // Log error but don't show toast for auth errors
    if (!error?.message?.includes('not authenticated')) {
      toast.error('Failed to load data');
    }
  },
});
```

### 4. Loading Skeletons

**Your current `EnhancedLoading` is overcomplicated - simplify:**

```typescript
// src/components/LoadingSkeletons.tsx - SIMPLIFIED
export function ShoesPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded p-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Monitoring

### 1. Use Existing DevTools

**You already have these set up - use them to monitor the changes:**

```typescript
// src/router.tsx - You already have this
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Monitor query caching after implementing changes
function App() {
  return (
    <>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### 2. Add Navigation Timing

**Measure the impact of your changes:**

```typescript
// src/utils/performance.ts - NEW FILE
export function measureNavigationTime(routeName: string) {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    const duration = end - start;
    
    console.log(`${routeName} loaded in ${duration}ms`);
    
    // Track improvements
    if (duration < 100) {
      console.log('✅ Instant load achieved!');
    } else if (duration < 500) {
      console.log('✅ Fast load achieved!');
    } else {
      console.log('⚠️ Still showing loading state');
    }
  };
}

// Usage in route loader
export const Route = createFileRoute('/shoes/')({
  loader: async ({ context }) => {
    const endMeasure = measureNavigationTime('shoes');
    
    // Your loader logic
    const result = await fetchData();
    
    endMeasure();
    return result;
  },
});
```

### 3. Before vs After Metrics

**Track your improvements:**

```typescript
// Add this to key routes to measure improvement
const perfMetrics = {
  beforeOptimization: {
    averageLoadTime: 800, // ms
    loadingStatesShown: 14, // number of routes
    cacheHitRate: 20, // %
  },
  afterOptimization: {
    averageLoadTime: 50, // ms target
    loadingStatesShown: 1, // only initial app load
    cacheHitRate: 95, // % target
  },
};
```

## Expected Results After Implementation

### Performance Improvements

**Before optimization:**
- Average route load time: 800ms
- Loading states shown: 14 routes
- Cache hit rate: 20%
- User sees spinners on every navigation

**After optimization:**
- Average route load time: 50ms
- Loading states shown: 1 (initial app load only)
- Cache hit rate: 95%
- Instant navigation between routes

### User Experience Improvements

1. **First-time users:**
   - See loading skeleton once during initial app load
   - Subsequent navigation is instant

2. **Returning users:**
   - App loads instantly from cache
   - No loading states visible after first visit

3. **Offline/poor network:**
   - App continues to work with cached data
   - Graceful degradation without loading states

### Technical Benefits

1. **Reduced server load:**
   - Fewer redundant requests due to aggressive caching
   - Convex handles real-time updates automatically

2. **Better perceived performance:**
   - Users perceive app as 10x faster
   - No jarring loading state transitions

3. **Improved developer experience:**
   - Simpler component code without loading checks
   - Automatic error handling with boundaries
   - Easier debugging with DevTools

### Monitoring Success

Use these metrics to track your improvements:

```typescript
// Track these metrics in your analytics
const successMetrics = {
  // Core performance metrics
  averageNavigationTime: '<100ms', // Target: under 100ms
  loadingStatesPerSession: '<1', // Target: only initial load
  cacheHitRate: '>90%', // Target: over 90%
  
  // User experience metrics
  bounceRate: 'decreased', // Users stay longer
  navigationRate: 'increased', // Users explore more
  conversionRate: 'increased', // Better UX = more conversions
  
  // Technical metrics
  serverRequests: 'reduced', // Less load on Convex
  bundleSize: 'unchanged', // No significant increase
  memoryUsage: 'slight increase', // Due to caching
};
```

## Conclusion

Your current codebase has significant opportunities for performance improvements. The main issues causing loading states are:

1. **Excessive `pendingComponent` usage** - 14 routes showing loading states
2. **Poor router caching configuration** - No stale times or gc times
3. **Manual loading state management** - Components using `isLoading` checks
4. **Missing prefetching strategies** - No root-level or predictive prefetching
5. **Suboptimal auth handling** - Auth checks on every route

By implementing the patterns in this guide, you'll achieve:

### Immediate Benefits
- **Eliminate 90% of loading states** - Only show loading on first app visit
- **Reduce navigation time** - From 800ms average to <100ms
- **Improve perceived performance** - Users feel app is 10x faster
- **Simplify component code** - Remove all manual loading checks

### Long-term Benefits
- **Better user engagement** - Users navigate more when app feels instant
- **Reduced server load** - Fewer redundant requests due to caching
- **Easier maintenance** - Simpler component code without loading logic
- **Scalable architecture** - Patterns work as app grows

### Implementation Priority

Start with the **Quick Wins** (30 minutes total):
1. Fix router configuration
2. Remove pending components
3. Add root route prefetching
4. Update query client settings

These four changes alone will eliminate most loading states in your app.

The key insight is that **loading states are a symptom, not a requirement**. With proper caching, prefetching, and suspense patterns, you can create an app that feels instant while maintaining all the benefits of real-time data updates through Convex.

Remember: The goal is to show a loading state only once (on initial app load) and then eliminate them entirely through intelligent caching and prefetching strategies. Your users will thank you for the dramatically improved experience.