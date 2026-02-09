import { ConvexReactClient } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { offlineDB } from "./offlineDB";
import type { Collection, Shoe, Run } from "~/types";

// Sync status types
export type SyncStatus = "idle" | "syncing" | "error" | "conflict";

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  pendingOperations: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
}

export interface SyncError {
  id: string;
  operation: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

export interface SyncConflict {
  id: string;
  type: "collection" | "shoe" | "run";
  localData: any;
  remoteData: any;
  timestamp: Date;
  resolved?: boolean;
}

export interface SyncOptions {
  forceFullSync?: boolean;
  conflictResolution?: "local" | "remote" | "manual";
  retryFailedOperations?: boolean;
}

class SyncService {
  private convex: ConvexReactClient | null = null;
  private syncInProgress = false;
  private syncListeners: Set<(state: SyncState) => void> = new Set();
  private currentSyncState: SyncState = {
    status: "idle",
    lastSync: null,
    pendingOperations: 0,
    errors: [],
    conflicts: [],
  };

  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly BATCH_SIZE = 50;

  private syncInterval: NodeJS.Timeout | null = null;

  initialize(convexClient: ConvexReactClient) {
    this.convex = convexClient;
    this.loadSyncState();
    this.startPeriodicSync();

    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));
  }

  private async loadSyncState() {
    try {
      const lastSync = await offlineDB.getMetadata("lastSyncTime");
      const errors = (await offlineDB.getMetadata("syncErrors")) || [];
      const conflicts = (await offlineDB.getMetadata("syncConflicts")) || [];
      const syncQueue = await offlineDB.getSyncQueue();

      this.currentSyncState = {
        status: "idle",
        lastSync: lastSync ? new Date(lastSync) : null,
        pendingOperations: syncQueue.length,
        errors: errors.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        })),
        conflicts: conflicts.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp),
        })),
      };

      this.notifyListeners();
    } catch (error) {
      console.error("Failed to load sync state:", error);
    }
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.sync({ retryFailedOperations: true });
      }
    }, this.SYNC_INTERVAL);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private handleOnline() {
    console.log("Device came online, initiating sync...");
    this.sync({ retryFailedOperations: true });
  }

  private handleOffline() {
    console.log("Device went offline");
    this.updateSyncStatus("idle");
  }

  // Main sync method
  async sync(options: SyncOptions = {}): Promise<void> {
    if (this.syncInProgress || !this.convex || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    this.updateSyncStatus("syncing");

    try {
      // Step 1: Push local changes to server
      await this.pushLocalChanges(options);

      // Step 2: Pull remote changes from server
      if (options.forceFullSync) {
        await this.pullAllData();
      } else {
        await this.pullIncrementalChanges();
      }

      // Step 3: Resolve conflicts if any
      await this.resolveConflicts(options.conflictResolution || "manual");

      // Step 4: Update sync metadata
      await offlineDB.setMetadata("lastSyncTime", Date.now());

      this.currentSyncState.lastSync = new Date();
      this.currentSyncState.pendingOperations = 0;
      this.updateSyncStatus("idle");

      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      await this.handleSyncError(error as Error);
      this.updateSyncStatus("error");
    } finally {
      this.syncInProgress = false;
    }
  }

  // Push local changes to server
  private async pushLocalChanges(options: SyncOptions): Promise<void> {
    const syncQueue = await offlineDB.getSyncQueue();

    if (syncQueue.length === 0) {
      return;
    }

    console.log(`Pushing ${syncQueue.length} local changes...`);

    // Process in batches
    for (let i = 0; i < syncQueue.length; i += this.BATCH_SIZE) {
      const batch = syncQueue.slice(i, i + this.BATCH_SIZE);
      await this.processSyncBatch(batch);
    }
  }

  private async processSyncBatch(batch: any[]): Promise<void> {
    const promises = batch.map(async (item) => {
      try {
        await this.processSyncItem(item);
        await offlineDB.removeSyncQueueItem(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        await offlineDB.incrementSyncRetry(item.id, (error as Error).message);
      }
    });

    await Promise.allSettled(promises);
  }

  private async processSyncItem(item: any): Promise<void> {
    if (!this.convex) throw new Error("Convex client not initialized");

    const { type, table, data } = item;

    try {
      switch (table) {
        case "collections":
          await this.syncCollection(type, data);
          break;
        case "shoes":
          await this.syncShoe(type, data);
          break;
        case "runs":
          await this.syncRun(type, data);
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }
    } catch (error) {
      // Check if it's a conflict error
      if (
        (error as any).message?.includes("conflict") ||
        (error as any).message?.includes("version")
      ) {
        await this.handleConflict(table, data, error as Error);
      } else {
        throw error;
      }
    }
  }

  private async syncCollection(type: string, data: Collection): Promise<void> {
    if (!this.convex) return;

    switch (type) {
      case "create":
      case "update": {
        const result = await this.convex.mutation(api.shoes.createCollection, {
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
        });

        // Update local data with server ID if it was a create operation
        if (type === "create" && result) {
          const updatedData = { ...data, id: result };
          await offlineDB.saveCollection(updatedData);
        }
        break;
      }
      case "delete":
        await this.convex.mutation(api.shoes.deleteCollection, { id: data.id });
        break;
    }
  }

  private async syncShoe(type: string, data: Shoe): Promise<void> {
    if (!this.convex) return;

    switch (type) {
      case "create":
      case "update": {
        const shoeData = {
          name: data.name,
          model: data.model,
          brand: data.brand,
          collectionId: data.collectionId,
          maxMileage: data.maxMileage,
          purchaseDate: data.purchaseDate,
          purchasePrice: data.purchasePrice,
          notes: data.notes,
          size: data.size,
          weight: data.weight,
          dropHeight: data.dropHeight,
        };

        const result =
          type === "create"
            ? await this.convex.mutation(api.shoes.createShoe, shoeData)
            : await this.convex.mutation(api.shoes.updateShoe, {
                id: data.id,
                ...shoeData,
              });

        if (type === "create" && result) {
          const updatedData = { ...data, id: result };
          await offlineDB.saveShoe(updatedData);
        }
        break;
      }
      case "delete":
        await this.convex.mutation(api.shoes.deleteShoe, { id: data.id });
        break;
    }
  }

  private async syncRun(type: string, data: Run): Promise<void> {
    if (!this.convex) return;

    switch (type) {
      case "create":
      case "update": {
        const runData = {
          date: data.date,
          distance: data.distance,
          duration: data.duration,
          pace: data.pace,
          shoeId: data.shoeId,
          runType: data.runType,
          surface: data.surface,
          effort: data.effort,
          weather: data.weather,
          temperature: data.temperature,
          notes: data.notes,
          route: data.route,
          elevation: data.elevation,
          heartRate: data.heartRate,
          calories: data.calories,
        };

        const result =
          type === "create"
            ? await this.convex.mutation(api.shoes.createRun, runData)
            : await this.convex.mutation(api.shoes.updateRun, {
                id: data.id,
                ...runData,
              });

        if (type === "create" && result) {
          const updatedData = { ...data, id: result };
          await offlineDB.saveRun(updatedData);
        }
        break;
      }
      case "delete":
        await this.convex.mutation(api.shoes.deleteRun, { id: data.id });
        break;
    }
  }

  // Pull remote changes from server
  private async pullAllData(): Promise<void> {
    if (!this.convex) return;

    console.log("Pulling all data from server...");

    try {
      const [collectionsData, shoesData, runsData] = await Promise.all([
        this.convex.query(api.shoes.getCollections, {}),
        this.convex.query(api.shoes.getShoes, { includeRetired: true }),
        this.convex.query(api.shoes.getRuns, { limit: 1000 }),
      ]);

      // Convert Convex data format to our types
      const collections = collectionsData.map(
        ({ _id, _creationTime, ...rest }: any) => ({
          ...rest,
          id: _id,
        }),
      );

      const shoes = shoesData.map(({ _id, _creationTime, ...rest }: any) => ({
        ...rest,
        id: _id,
      }));

      const runs = runsData.map(({ _id, _creationTime, ...rest }: any) => ({
        ...rest,
        id: _id,
      }));

      // Bulk save to offline database
      await Promise.all([
        offlineDB.bulkSaveCollections(collections),
        offlineDB.bulkSaveShoes(shoes),
        offlineDB.bulkSaveRuns(runs),
      ]);

      console.log(
        `Pulled ${collections.length} collections, ${shoes.length} shoes, ${runs.length} runs`,
      );
    } catch (error) {
      console.error("Failed to pull data from server:", error);
      throw error;
    }
  }

  private async pullIncrementalChanges(): Promise<void> {
    const lastSync = this.currentSyncState.lastSync;

    if (!lastSync) {
      // No previous sync, pull all data
      return this.pullAllData();
    }

    console.log(
      `Pulling incremental changes since ${lastSync.toISOString()}...`,
    );

    // For now, we'll do a full sync since Convex doesn't have built-in incremental sync
    // In a production app, you'd implement change tracking on the server side
    return this.pullAllData();
  }

  // Conflict resolution
  private async handleConflict(
    table: string,
    localData: any,
    error: Error,
  ): Promise<void> {
    // Try to get the current server version
    let remoteData = null;

    try {
      if (this.convex) {
        switch (table) {
          case "collections":
            remoteData = await this.convex.query(api.shoes.getCollection, {
              id: localData.id,
            });
            break;
          case "shoes":
            remoteData = await this.convex.query(api.shoes.getShoe, {
              id: localData.id,
            });
            break;
          case "runs":
            remoteData = await this.convex.query(api.shoes.getRun, {
              id: localData.id,
            });
            break;
        }
      }
    } catch (e) {
      // Item might have been deleted on server
      console.warn(`Could not fetch remote data for conflict resolution: ${e}`);
    }

    const conflict: SyncConflict = {
      id: `${table}_${localData.id}_${Date.now()}`,
      type: table as "collection" | "shoe" | "run",
      localData,
      remoteData,
      timestamp: new Date(),
      resolved: false,
    };

    this.currentSyncState.conflicts.push(conflict);
    await this.saveSyncState();
    this.notifyListeners();
  }

  private async resolveConflicts(
    strategy: "local" | "remote" | "manual",
  ): Promise<void> {
    const unresolvedConflicts = this.currentSyncState.conflicts.filter(
      (c) => !c.resolved,
    );

    if (unresolvedConflicts.length === 0) {
      return;
    }

    console.log(
      `Resolving ${unresolvedConflicts.length} conflicts with strategy: ${strategy}`,
    );

    for (const conflict of unresolvedConflicts) {
      try {
        await this.resolveConflict(conflict, strategy);
      } catch (error) {
        console.error(`Failed to resolve conflict ${conflict.id}:`, error);
      }
    }
  }

  private async resolveConflict(
    conflict: SyncConflict,
    strategy: "local" | "remote" | "manual",
  ): Promise<void> {
    if (strategy === "manual") {
      // Manual resolution requires user input - conflicts remain unresolved
      return;
    }

    const dataToUse =
      strategy === "local" ? conflict.localData : conflict.remoteData;

    if (!dataToUse) {
      // If remote data is null, the item was deleted on server
      if (strategy === "remote") {
        // Delete local copy
        switch (conflict.type) {
          case "collection":
            await offlineDB.deleteCollection(conflict.localData.id);
            break;
          case "shoe":
            await offlineDB.deleteShoe(conflict.localData.id);
            break;
          case "run":
            await offlineDB.deleteRun(conflict.localData.id);
            break;
        }
      }
    } else {
      // Update with chosen version
      switch (conflict.type) {
        case "collection":
          if (strategy === "local" && this.convex) {
            await this.syncCollection("update", dataToUse);
          } else {
            await offlineDB.saveCollection(dataToUse);
          }
          break;
        case "shoe":
          if (strategy === "local" && this.convex) {
            await this.syncShoe("update", dataToUse);
          } else {
            await offlineDB.saveShoe(dataToUse);
          }
          break;
        case "run":
          if (strategy === "local" && this.convex) {
            await this.syncRun("update", dataToUse);
          } else {
            await offlineDB.saveRun(dataToUse);
          }
          break;
      }
    }

    // Mark conflict as resolved
    conflict.resolved = true;
    await this.saveSyncState();
  }

  // Utility methods
  private async handleSyncError(error: Error): Promise<void> {
    const syncError: SyncError = {
      id: `error_${Date.now()}`,
      operation: "sync",
      error: error.message,
      timestamp: new Date(),
      retryCount: 0,
    };

    this.currentSyncState.errors.push(syncError);
    await this.saveSyncState();
    this.notifyListeners();
  }

  private async saveSyncState(): Promise<void> {
    await Promise.all([
      offlineDB.setMetadata("syncErrors", this.currentSyncState.errors),
      offlineDB.setMetadata("syncConflicts", this.currentSyncState.conflicts),
    ]);
  }

  private updateSyncStatus(status: SyncStatus): void {
    this.currentSyncState.status = status;
    this.notifyListeners();
  }

  // Public API
  getSyncState(): SyncState {
    return { ...this.currentSyncState };
  }

  addSyncListener(listener: (state: SyncState) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notifyListeners(): void {
    this.syncListeners.forEach((listener) => {
      try {
        listener(this.currentSyncState);
      } catch (error) {
        console.error("Error in sync listener:", error);
      }
    });
  }

  async forceSyncNow(): Promise<void> {
    return this.sync({ forceFullSync: true, retryFailedOperations: true });
  }

  async resolveConflictManually(
    conflictId: string,
    useLocal: boolean,
  ): Promise<void> {
    const conflict = this.currentSyncState.conflicts.find(
      (c) => c.id === conflictId,
    );

    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const strategy = useLocal ? "local" : "remote";
    await this.resolveConflict(conflict, strategy);
    this.notifyListeners();
  }

  async clearSyncErrors(): Promise<void> {
    this.currentSyncState.errors = [];
    await this.saveSyncState();
    this.notifyListeners();
  }

  async clearResolvedConflicts(): Promise<void> {
    this.currentSyncState.conflicts = this.currentSyncState.conflicts.filter(
      (c) => !c.resolved,
    );
    await this.saveSyncState();
    this.notifyListeners();
  }

  // Get sync statistics
  async getSyncStats(): Promise<{
    totalSyncs: number;
    lastSyncDuration: number;
    avgSyncDuration: number;
    errorRate: number;
    pendingConflicts: number;
  }> {
    // This would be implemented with proper metrics collection
    return {
      totalSyncs: 0,
      lastSyncDuration: 0,
      avgSyncDuration: 0,
      errorRate: 0,
      pendingConflicts: this.currentSyncState.conflicts.filter(
        (c) => !c.resolved,
      ).length,
    };
  }

  // Cleanup
  destroy(): void {
    this.stopPeriodicSync();
    this.syncListeners.clear();
    window.removeEventListener("online", this.handleOnline.bind(this));
    window.removeEventListener("offline", this.handleOffline.bind(this));
  }
}

// Export singleton instance
export const syncService = new SyncService();
