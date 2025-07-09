# MyShoeTracker Architecture: Data Flow, Caching, and Offline Support

## Overview

This document explains how MyShoeTracker's data architecture works, covering the intersection of TanStack Router loaders, Convex real-time database, React Query caching, service workers, and offline support. Understanding these interactions is crucial for maintaining performance and reliability.

## Architecture Layers

### 1. Data Sources and Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Convex Cloud  │    │  Service Worker  │    │  IndexedDB      │
│   (Remote DB)   │◄──►│   (Proxy/Cache)  │◄──►│  (Local Store)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ ConvexQueryClient│    │ React Query Cache│    │  Sync Service   │
│ (Convex Bridge) │◄──►│  (Memory Cache)  │◄──►│ (Sync Manager)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ TanStack Router │    │   Components     │    │  Prefetcher     │
│    (Loaders)    │◄──►│  (useQuery)      │◄──►│ (Background)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2. Request Flow Hierarchy

#### Online Mode (Optimal Path)
1. **Component Request** → `useQuery`
2. **Memory Cache Check** → React Query cache
3. **Cache Hit** → Instant return (0ms)
4. **Cache Miss** → ConvexQueryClient
5. **Convex Request** → Real-time WebSocket/HTTP
6. **Data Return** → Cache + Component update

#### Offline Mode (Fallback Path)
1. **Component Request** → `useQuery`
2. **Memory Cache Check** → React Query cache
3. **Cache Miss** → Service Worker intercept
4. **IndexedDB Query** → Local offline store
5. **Data Return** → Cache + Component update
6. **Background Queue** → Sync operations for later

## Core Systems Integration

### TanStack Router Loaders

**Purpose**: Pre-populate caches before route rendering
**Optimization Strategy**: Background prefetching without blocking navigation

```typescript
// BEFORE: Blocking loader (causes slow navigation)
loader: async ({ context: { queryClient } }) => {
  const data = await queryClient.ensureQueryData(query);
  return { data }; // Blocks until complete
}

// AFTER: Non-blocking prefetch (instant navigation)
loader: async ({ context: { queryClient } }) => {
  queryClient.prefetchQuery(query).catch(() => {}); // Background only
  return {}; // Returns immediately
}
```

**Benefits**:
- ✅ Routes load instantly (0ms navigation)
- ✅ Data loads progressively in background
- ✅ Cached data available immediately on subsequent visits
- ✅ Resilient to network failures

### React Query Caching Strategy

**Ultra-Aggressive Caching Configuration**:
```typescript
{
  staleTime: 1000 * 60 * 15,        // 15min - keep data fresh
  gcTime: 1000 * 60 * 60,           // 1hr - keep in memory
  refetchOnWindowFocus: false,       // No auto-refetch
  refetchOnMount: false,             // Use cached data
  refetchOnReconnect: false,         // No reconnect refetch
  retry: false,                      // Fast failures
  networkMode: "online"              // Offline handling via SW
}
```

**Loading State Logic**:
```typescript
// Prevent loading flicker when data is cached
const isActuallyLoading = 
  (query.isLoading && !query.data) && // No cached data
  hasNoData;                          // Truly no data available

// Only show loading for genuine first-time loads
if (isActuallyLoading) {
  return <LoadingComponent />
}
```

### Convex Integration

**Real-time Features**:
- WebSocket subscriptions for live updates
- Optimistic updates for immediate UI feedback
- Automatic conflict resolution
- Server-side authentication and authorization

**Offline Considerations**:
- Convex requires network connectivity
- Service Worker intercepts failed requests
- Local IndexedDB serves as fallback data source
- Sync service handles data reconciliation

### Service Worker Architecture

**Multi-Strategy Caching**:

```javascript
// Convex API: Network-first with fallback
{
  urlPattern: /^https:\/\/api\.convex\.cloud\/.*/,
  handler: "NetworkFirst",
  options: {
    cacheName: "convex-api-cache",
    expiration: { maxAgeSeconds: 300 } // 5min cache
  }
}

// Static assets: Cache-first
{
  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  handler: "CacheFirst",
  options: {
    cacheName: "images-cache",
    expiration: { maxAgeSeconds: 2592000 } // 30 days
  }
}
```

**Request Interception Flow**:
1. **Network Request** → Service Worker intercepts
2. **Strategy Check** → Apply caching strategy
3. **Network First** → Try network, fallback to cache
4. **Cache Miss** → Query IndexedDB for offline data
5. **Background Sync** → Queue failed operations

### Offline Database (IndexedDB)

**Schema Design**:
```typescript
interface OfflineRecord {
  id: string;
  data: Collection | Shoe | Run;
  _lastModified: number;
  _offline: boolean;          // Created offline
  _syncStatus: "pending" | "synced" | "conflict";
}
```

**Sync Queue Management**:
```typescript
interface SyncQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  table: "collections" | "shoes" | "runs";
  data: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}
```

### Background Sync Service

**Conflict Resolution Strategy**:
1. **Detect Conflicts** → Compare timestamps and checksums
2. **Auto-Resolution** → Last-write-wins for simple cases
3. **Manual Resolution** → User choice for complex conflicts
4. **Merge Strategy** → Combine non-conflicting changes

**Sync Phases**:
1. **Push Phase** → Upload local changes to Convex
2. **Pull Phase** → Download remote changes from Convex
3. **Conflict Resolution** → Handle data conflicts
4. **Cleanup Phase** → Remove resolved items from queue

## Performance Optimizations

### 1. Aggressive Prefetching

**Router-Level Prefetching**:
```typescript
defaultPreload: "intent",          // Preload on hover/focus
defaultPreloadDelay: 10,           // 10ms delay
defaultPendingMs: 0,               // No navigation delay
```

**Component-Level Prefetching**:
- Hover/focus event listeners on links
- Viewport intersection observer for visible links
- Behavior-based prediction for likely routes

### 2. Cache Optimization

**Memory Management**:
- Long stale times prevent unnecessary refetches
- Extended garbage collection keeps data longer
- Disabled automatic refetching reduces network overhead

**Storage Efficiency**:
- IndexedDB for large offline datasets
- Service Worker cache for API responses
- React Query memory cache for active data

### 3. Loading State Management

**Preventing Loading Flicker**:
```typescript
// Bad: Shows loading even when data is cached
if (query.isLoading) return <Loading />

// Good: Only shows loading when truly needed
if (query.isLoading && !query.data && hasNoData) {
  return <Loading />
}
```

## Offline Support Implementation

### Data Availability Matrix

| Data Type | Online | Offline (Cached) | Offline (No Cache) |
|-----------|--------|------------------|-------------------|
| Collections | ✅ Real-time | ✅ Last cached | ❌ Not available |
| Shoes | ✅ Real-time | ✅ Last cached | ❌ Not available |
| Runs | ✅ Real-time | ✅ Last cached | ❌ Not available |
| Images | ✅ CDN | ✅ IndexedDB cache | ❌ Placeholder |
| Search | ✅ Server | ✅ Local IndexedDB | ✅ Limited local |

### User Experience Patterns

**Online → Offline Transition**:
1. Service Worker detects offline state
2. API requests automatically fallback to cache
3. UI shows offline indicator
4. New data gets queued for sync
5. Read-only mode with "will sync later" messaging

**Offline → Online Transition**:
1. Service Worker detects online state
2. Background sync automatically triggers
3. Queued operations process in order
4. Conflicts resolved automatically or prompt user
5. UI returns to normal operation

### Data Consistency Guarantees

**Eventual Consistency Model**:
- Local changes immediately visible in UI
- Background sync ensures server consistency
- Conflict resolution maintains data integrity
- Multiple device sync supported

**Conflict Resolution Priorities**:
1. **No Conflict** → Direct merge
2. **Timestamp-based** → Last write wins
3. **User Choice** → Manual resolution UI
4. **Field-level** → Merge non-conflicting fields

## Monitoring and Debugging

### Performance Metrics

**Cache Hit Rates**:
- React Query cache hits (target: >90%)
- Service Worker cache hits (target: >80%)
- IndexedDB fallback usage (minimize)

**Loading Performance**:
- Time to first content (target: <100ms)
- Route navigation speed (target: instant)
- Data freshness (target: <15min staleness)

### Debug Tools

**Development Helpers**:
```typescript
// Cache inspection
queryClient.getQueryCache().getAll()

// Offline database stats
offlineDB.getOfflineStats()

// Sync service status
syncService.getSyncState()

// Service Worker status
navigator.serviceWorker.getRegistration()
```

**Production Monitoring**:
- Cache performance metrics
- Offline usage statistics
- Sync success/failure rates
- User experience tracking

## Best Practices

### For Developers

1. **Always use background prefetching** in route loaders
2. **Check for cached data** before showing loading states
3. **Handle offline gracefully** with meaningful error messages
4. **Test offline scenarios** during development
5. **Monitor cache hit rates** and optimize accordingly

### For Data Mutations

1. **Optimistic updates** for immediate UI feedback
2. **Queue offline operations** for later sync
3. **Handle conflicts gracefully** with user choice
4. **Invalidate related caches** after mutations
5. **Provide sync status feedback** to users

### For Performance

1. **Minimize unnecessary refetches** with aggressive caching
2. **Preload critical data** before user needs it
3. **Use service worker** for reliable caching
4. **Implement progressive loading** for large datasets
5. **Monitor and optimize** cache strategies regularly

## Future Considerations

### Scalability Improvements

1. **Intelligent Prefetching** → ML-based prediction of user behavior
2. **Partial Sync** → Delta synchronization for large datasets
3. **Edge Caching** → CDN integration for global performance
4. **Compression** → Client-side data compression for storage

### Advanced Features

1. **Multi-device Sync** → Real-time synchronization across devices
2. **Collaborative Editing** → Operational transforms for concurrent edits
3. **Offline Search** → Full-text search in IndexedDB
4. **Background Analytics** → Offline analytics collection and sync

This architecture provides a robust foundation for high-performance, offline-capable data management while maintaining excellent user experience across all network conditions.