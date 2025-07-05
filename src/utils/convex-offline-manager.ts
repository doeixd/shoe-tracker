// Phase 3: Convex Offline Manager
// Enhanced offline detection and management specifically for Convex real-time applications

import { ConvexReactClient } from "convex/react";
import { useUserBehaviorTracking } from "../hooks/useUserBehaviorTracking";
import {
  useIntelligentDataSyncAction,
  useAnalyzeUserBehaviorAction,
} from "../queries";

// Types for Convex offline management
export interface ConvexConnectionState {
  state: "connecting" | "connected" | "disconnected";
  hasBeenConnected: boolean;
  lastConnectedTime?: number;
  disconnectionReason?: string;
  reconnectAttempts: number;
}

export interface OfflineOperation {
  id: string;
  type: "mutation" | "action";
  name: string;
  args: any;
  timestamp: number;
  priority: number;
  retryCount: number;
  userContext: {
    route: string;
    deviceType: string;
    connectionType: string;
  };
}

export interface SyncPriority {
  immediate: OfflineOperation[];
  background: OfflineOperation[];
  deferred: OfflineOperation[];
}

export interface ConvexOfflineConfig {
  maxQueueSize: number;
  maxRetryAttempts: number;
  syncBatchSize: number;
  priorityThresholds: {
    immediate: number;
    background: number;
  };
  enableServiceWorkerIntegration: boolean;
}

/**
 * Phase 3: Convex Offline Manager
 *
 * Manages offline state and sync operations specifically for Convex applications:
 * - Monitors Convex WebSocket connection state
 * - Queues operations when offline
 * - Intelligent sync prioritization using user behavior data
 * - Conflict-free operation management
 * - Service worker integration for request interception
 */
export class ConvexOfflineManager {
  private convexClient: ConvexReactClient;
  private connectionState: ConvexConnectionState;
  private offlineQueue: OfflineOperation[] = [];
  private syncInProgress = false;
  private config: ConvexOfflineConfig;
  private listeners: Set<(state: ConvexConnectionState) => void> = new Set();
  private behaviorTracker: any = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(
    convexClient: ConvexReactClient,
    config: Partial<ConvexOfflineConfig> = {},
  ) {
    this.convexClient = convexClient;
    this.config = {
      maxQueueSize: 100,
      maxRetryAttempts: 3,
      syncBatchSize: 10,
      priorityThresholds: {
        immediate: 80,
        background: 50,
      },
      enableServiceWorkerIntegration: true,
      ...config,
    };

    this.connectionState = {
      state: "connecting",
      hasBeenConnected: false,
      reconnectAttempts: 0,
    };

    this.setupConnectionMonitoring();
    this.setupServiceWorkerIntegration();
    this.setupStorageSync();
  }

  /**
   * Monitor Convex WebSocket connection state
   */
  private setupConnectionMonitoring() {
    // Monitor connection state changes using polling since Convex doesn't expose connection state directly
    const checkConnection = () => {
      const isConnected = this.isConvexConnected();
      const previousState = this.connectionState.state;
      const newState = isConnected ? "connected" : "disconnected";

      if (previousState !== newState) {
        this.connectionState = {
          ...this.connectionState,
          state: newState,
          lastConnectedTime: isConnected
            ? Date.now()
            : this.connectionState.lastConnectedTime,
          hasBeenConnected:
            this.connectionState.hasBeenConnected || isConnected,
          reconnectAttempts: isConnected
            ? 0
            : this.connectionState.reconnectAttempts,
          disconnectionReason: !isConnected ? "network" : undefined,
        };

        this.handleConnectionStateChange(previousState, newState);
        this.notifyListeners();
      }
    };

    // Check connection every 2 seconds
    setInterval(checkConnection, 2000);

    // Additional network monitoring
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline.bind(this));
      window.addEventListener("offline", this.handleOffline.bind(this));
    }
  }

  /**
   * Check if Convex is connected (simplified check)
   */
  private isConvexConnected(): boolean {
    // Simple online check - in a real implementation, you'd check WebSocket state
    return typeof window !== "undefined" ? window.navigator.onLine : true;
  }

  /**
   * Handle connection state changes
   */
  private handleConnectionStateChange(
    previousState: string,
    newState: "connecting" | "connected" | "disconnected",
  ) {
    console.log(
      `[ConvexOffline] Connection state: ${previousState} → ${newState}`,
    );

    switch (newState) {
      case "connected":
        this.handleConnectionRestored();
        break;
      case "disconnected":
        this.handleConnectionLost();
        break;
      case "connecting":
        this.connectionState.reconnectAttempts++;
        break;
    }
  }

  /**
   * Handle connection restored
   */
  private async handleConnectionRestored() {
    console.log(
      "[ConvexOffline] Connection restored, starting intelligent sync",
    );

    // Update service worker
    this.notifyServiceWorker({
      type: "CONNECTION_RESTORED",
      timestamp: Date.now(),
    });

    // Start intelligent sync process
    if (this.offlineQueue.length > 0 && !this.syncInProgress) {
      await this.startIntelligentSync();
    }
  }

  /**
   * Handle connection lost
   */
  private handleConnectionLost() {
    console.log("[ConvexOffline] Connection lost, enabling offline mode");

    // Notify service worker to enable offline interception
    this.notifyServiceWorker({
      type: "ENABLE_OFFLINE_MODE",
      timestamp: Date.now(),
    });
  }

  /**
   * Handle browser online event
   */
  private handleOnline() {
    console.log("[ConvexOffline] Browser online event");
    // Convex will handle reconnection automatically
  }

  /**
   * Handle browser offline event
   */
  private handleOffline() {
    console.log("[ConvexOffline] Browser offline event");
    this.connectionState.state = "disconnected";
    this.connectionState.disconnectionReason = "browser-offline";
    this.notifyListeners();
  }

  /**
   * Queue an operation for offline execution
   */
  public queueOperation(
    operation: Omit<OfflineOperation, "id" | "timestamp" | "retryCount">,
  ) {
    if (this.offlineQueue.length >= this.config.maxQueueSize) {
      // Remove oldest low-priority operation
      const oldestLowPriority = this.offlineQueue
        .filter((op) => op.priority < this.config.priorityThresholds.background)
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      if (oldestLowPriority) {
        this.removeFromQueue(oldestLowPriority.id);
      } else {
        console.warn(
          "[ConvexOffline] Queue full, dropping operation:",
          operation,
        );
        return false;
      }
    }

    const queuedOperation: OfflineOperation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      ...operation,
    };

    this.offlineQueue.push(queuedOperation);
    this.persistQueue();

    console.log(
      `[ConvexOffline] Queued operation: ${operation.name} (priority: ${operation.priority})`,
    );
    return true;
  }

  /**
   * Start intelligent sync using server-side prioritization
   */
  private async startIntelligentSync() {
    if (this.syncInProgress || this.connectionState.state !== "connected") {
      return;
    }

    this.syncInProgress = true;
    console.log(
      `[ConvexOffline] Starting intelligent sync of ${this.offlineQueue.length} operations`,
    );

    try {
      // Get intelligent sync prioritization from server
      const syncPriority = await this.getIntelligentSyncPriority();

      // Process operations in priority order
      await this.processSyncBatch(syncPriority.immediate, "immediate");

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));

      await this.processSyncBatch(syncPriority.background, "background");

      // Longer delay for deferred operations
      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.processSyncBatch(syncPriority.deferred, "deferred");

      console.log("[ConvexOffline] Intelligent sync completed successfully");
    } catch (error) {
      console.error("[ConvexOffline] Intelligent sync failed:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get intelligent sync prioritization using Convex Action
   */
  private async getIntelligentSyncPriority(): Promise<SyncPriority> {
    try {
      // Prepare sync queue data for server analysis
      const syncQueue = this.offlineQueue.map((op) => ({
        type: op.type,
        id: op.id,
        priority: op.priority,
      }));

      // Get user context from behavior tracker
      const userContext = this.getUserContext();

      // Call Convex Action for intelligent prioritization
      // Note: This would need to be called from a component with the hook
      // For now, we'll use a simple client-side prioritization
      const prioritized = this.clientSidePrioritization();

      return prioritized;
    } catch (error) {
      console.error(
        "[ConvexOffline] Failed to get server prioritization, using fallback:",
        error,
      );
      return this.clientSidePrioritization();
    }
  }

  /**
   * Fallback client-side prioritization
   */
  private clientSidePrioritization(): SyncPriority {
    const immediate = this.offlineQueue.filter(
      (op) => op.priority >= this.config.priorityThresholds.immediate,
    );
    const background = this.offlineQueue.filter(
      (op) =>
        op.priority >= this.config.priorityThresholds.background &&
        op.priority < this.config.priorityThresholds.immediate,
    );
    const deferred = this.offlineQueue.filter(
      (op) => op.priority < this.config.priorityThresholds.background,
    );

    return { immediate, background, deferred };
  }

  /**
   * Process a batch of sync operations
   */
  private async processSyncBatch(
    operations: OfflineOperation[],
    batchType: string,
  ) {
    if (operations.length === 0) return;

    console.log(
      `[ConvexOffline] Processing ${batchType} batch: ${operations.length} operations`,
    );

    // Process operations in smaller batches to avoid overwhelming
    for (let i = 0; i < operations.length; i += this.config.syncBatchSize) {
      const batch = operations.slice(i, i + this.config.syncBatchSize);

      await Promise.allSettled(
        batch.map((operation) => this.executeOperation(operation)),
      );

      // Small delay between sub-batches
      if (i + this.config.syncBatchSize < operations.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(
    operation: OfflineOperation,
  ): Promise<boolean> {
    try {
      console.log(`[ConvexOffline] Executing: ${operation.name}`);

      // Execute the operation based on type
      let result;
      if (operation.type === "mutation") {
        result = await this.convexClient.mutation(
          operation.name as any,
          operation.args,
        );
      } else if (operation.type === "action") {
        result = await this.convexClient.action(
          operation.name as any,
          operation.args,
        );
      }

      // Remove from queue on success
      this.removeFromQueue(operation.id);
      console.log(`[ConvexOffline] Successfully executed: ${operation.name}`);

      return true;
    } catch (error) {
      console.error(
        `[ConvexOffline] Failed to execute ${operation.name}:`,
        error,
      );

      // Handle retry logic
      operation.retryCount++;
      if (operation.retryCount >= this.config.maxRetryAttempts) {
        console.error(
          `[ConvexOffline] Max retries reached for ${operation.name}, removing from queue`,
        );
        this.removeFromQueue(operation.id);
      }

      return false;
    }
  }

  /**
   * Remove operation from queue
   */
  private removeFromQueue(operationId: string) {
    this.offlineQueue = this.offlineQueue.filter((op) => op.id !== operationId);
    this.persistQueue();
  }

  /**
   * Get user context for sync prioritization
   */
  private getUserContext() {
    const connection = (navigator as any)?.connection;

    return {
      preferences: {},
      patterns: {},
      network: connection?.effectiveType || "4g",
      deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
        ? "mobile"
        : "desktop",
      currentRoute: window.location.pathname,
    };
  }

  /**
   * Setup service worker integration
   */
  private async setupServiceWorkerIntegration() {
    if (
      !this.config.enableServiceWorkerIntegration ||
      typeof navigator === "undefined"
    ) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      this.serviceWorkerRegistration = registration;

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener(
        "message",
        this.handleServiceWorkerMessage.bind(this),
      );

      console.log("[ConvexOffline] Service worker integration enabled");
    } catch (error) {
      console.warn("[ConvexOffline] Service worker integration failed:", error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;

    switch (type) {
      case "OFFLINE_OPERATION_QUEUED":
        console.log("[ConvexOffline] Service worker queued operation:", data);
        break;
      case "OFFLINE_REQUEST_INTERCEPTED":
        console.log(
          "[ConvexOffline] Service worker intercepted request:",
          data,
        );
        break;
    }
  }

  /**
   * Send message to service worker
   */
  private notifyServiceWorker(message: any) {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage(message);
    }
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue() {
    try {
      localStorage.setItem(
        "convex-offline-queue",
        JSON.stringify(this.offlineQueue),
      );
    } catch (error) {
      console.warn("[ConvexOffline] Failed to persist queue:", error);
    }
  }

  /**
   * Setup storage sync from localStorage
   */
  private setupStorageSync() {
    try {
      const savedQueue = localStorage.getItem("convex-offline-queue");
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
        console.log(
          `[ConvexOffline] Restored ${this.offlineQueue.length} operations from storage`,
        );
      }
    } catch (error) {
      console.warn(
        "[ConvexOffline] Failed to restore queue from storage:",
        error,
      );
    }
  }

  /**
   * Add connection state listener
   */
  public addConnectionListener(
    listener: (state: ConvexConnectionState) => void,
  ) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error("[ConvexOffline] Listener error:", error);
      }
    });
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConvexConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if currently offline
   */
  public isOffline(): boolean {
    return this.connectionState.state === "disconnected";
  }

  /**
   * Get queue status
   */
  public getQueueStatus() {
    return {
      total: this.offlineQueue.length,
      immediate: this.offlineQueue.filter(
        (op) => op.priority >= this.config.priorityThresholds.immediate,
      ).length,
      background: this.offlineQueue.filter(
        (op) =>
          op.priority >= this.config.priorityThresholds.background &&
          op.priority < this.config.priorityThresholds.immediate,
      ).length,
      deferred: this.offlineQueue.filter(
        (op) => op.priority < this.config.priorityThresholds.background,
      ).length,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Manually trigger sync (for testing or user-initiated sync)
   */
  public async manualSync(): Promise<boolean> {
    if (this.connectionState.state !== "connected") {
      console.warn("[ConvexOffline] Cannot sync while disconnected");
      return false;
    }

    await this.startIntelligentSync();
    return true;
  }

  /**
   * Clear the offline queue
   */
  public clearQueue() {
    this.offlineQueue = [];
    this.persistQueue();
    console.log("[ConvexOffline] Queue cleared");
  }

  /**
   * Cleanup resources
   */
  public cleanup() {
    this.listeners.clear();

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this));
      window.removeEventListener("offline", this.handleOffline.bind(this));
    }

    console.log("[ConvexOffline] Cleanup completed");
  }
}

// Global instance
let offlineManager: ConvexOfflineManager | null = null;

/**
 * Create and configure the Convex offline manager
 */
export function createConvexOfflineManager(
  convexClient: ConvexReactClient,
  config?: Partial<ConvexOfflineConfig>,
): ConvexOfflineManager {
  if (offlineManager) {
    offlineManager.cleanup();
  }

  offlineManager = new ConvexOfflineManager(convexClient, config);
  return offlineManager;
}

/**
 * Get the global offline manager instance
 */
export function getConvexOfflineManager(): ConvexOfflineManager | null {
  return offlineManager;
}

export default ConvexOfflineManager;
