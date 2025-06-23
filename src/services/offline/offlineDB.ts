import { openDB, DBSchema, IDBPDatabase } from "idb";
import type {
  Collection,
  Shoe,
  Run,
  ShoeWithStats,
  RunWithShoe,
  OverallStats,
} from "~/types";

// Database schema definition
interface OfflineDBSchema extends DBSchema {
  collections: {
    key: string;
    value: Collection & {
      _lastModified: number;
      _offline?: boolean;
      _syncStatus?: "pending" | "synced" | "conflict";
    };
    indexes: { "by-modified": number };
  };
  shoes: {
    key: string;
    value: Shoe & {
      _lastModified: number;
      _offline?: boolean;
      _syncStatus?: "pending" | "synced" | "conflict";
    };
    indexes: {
      "by-collection": string;
      "by-modified": number;
      "by-sync-status": string;
    };
  };
  runs: {
    key: string;
    value: Run & {
      _lastModified: number;
      _offline?: boolean;
      _syncStatus?: "pending" | "synced" | "conflict";
    };
    indexes: {
      "by-shoe": string;
      "by-date": string;
      "by-modified": number;
      "by-sync-status": string;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: "create" | "update" | "delete";
      table: "collections" | "shoes" | "runs";
      data: any;
      timestamp: number;
      retryCount: number;
      lastError?: string;
    };
    indexes: { "by-timestamp": number };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      timestamp: number;
    };
  };
  imageCache: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
      size: number;
    };
    indexes: { "by-timestamp": number };
  };
}

class OfflineDB {
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private readonly DB_NAME = "ShoeFitOfflineDB";
  private readonly DB_VERSION = 1;
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_RETRY_COUNT = 3;

  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await openDB<OfflineDBSchema>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);

          // Collections store
          if (!db.objectStoreNames.contains("collections")) {
            const collectionsStore = db.createObjectStore("collections", {
              keyPath: "id",
            });
            collectionsStore.createIndex("by-modified", "_lastModified");
          }

          // Shoes store
          if (!db.objectStoreNames.contains("shoes")) {
            const shoesStore = db.createObjectStore("shoes", { keyPath: "id" });
            shoesStore.createIndex("by-collection", "collectionId");
            shoesStore.createIndex("by-modified", "_lastModified");
            shoesStore.createIndex("by-sync-status", "_syncStatus");
          }

          // Runs store
          if (!db.objectStoreNames.contains("runs")) {
            const runsStore = db.createObjectStore("runs", { keyPath: "id" });
            runsStore.createIndex("by-shoe", "shoeId");
            runsStore.createIndex("by-date", "date");
            runsStore.createIndex("by-modified", "_lastModified");
            runsStore.createIndex("by-sync-status", "_syncStatus");
          }

          // Sync queue store
          if (!db.objectStoreNames.contains("syncQueue")) {
            const syncStore = db.createObjectStore("syncQueue", {
              keyPath: "id",
            });
            syncStore.createIndex("by-timestamp", "timestamp");
          }

          // Metadata store
          if (!db.objectStoreNames.contains("metadata")) {
            db.createObjectStore("metadata", { keyPath: "key" });
          }

          // Image cache store
          if (!db.objectStoreNames.contains("imageCache")) {
            const imageCacheStore = db.createObjectStore("imageCache", {
              keyPath: "url",
            });
            imageCacheStore.createIndex("by-timestamp", "timestamp");
          }
        },
        blocked() {
          console.warn("Database upgrade blocked by another tab");
        },
        blocking() {
          console.warn("Database needs upgrade, blocking other tabs");
        },
      });

      console.log("Offline database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize offline database:", error);
      throw error;
    }
  }

  private ensureDB(): IDBPDatabase<OfflineDBSchema> {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  // Collections CRUD operations
  async getCollections(): Promise<Collection[]> {
    const db = this.ensureDB();
    const collections = await db.getAll("collections");
    return collections.map(this.stripMetadata);
  }

  async getCollection(id: string): Promise<Collection | null> {
    const db = this.ensureDB();
    const collection = await db.get("collections", id);
    return collection ? this.stripMetadata(collection) : null;
  }

  async saveCollection(collection: Collection, offline = false): Promise<void> {
    const db = this.ensureDB();
    const enriched = {
      ...collection,
      _lastModified: Date.now(),
      _offline: offline,
      _syncStatus: offline ? ("pending" as const) : ("synced" as const),
    };
    await db.put("collections", enriched);

    if (offline) {
      await this.addToSyncQueue("collections", "update", collection);
    }
  }

  async deleteCollection(id: string, offline = false): Promise<void> {
    const db = this.ensureDB();
    await db.delete("collections", id);

    if (offline) {
      await this.addToSyncQueue("collections", "delete", { id });
    }
  }

  // Shoes CRUD operations
  async getShoes(includeRetired = false): Promise<Shoe[]> {
    const db = this.ensureDB();
    let shoes = await db.getAll("shoes");

    if (!includeRetired) {
      shoes = shoes.filter((shoe) => !shoe.isRetired);
    }

    return shoes.map(this.stripMetadata);
  }

  async getShoesByCollection(
    collectionId: string,
    includeRetired = false,
  ): Promise<Shoe[]> {
    const db = this.ensureDB();
    let shoes = await db.getAllFromIndex(
      "shoes",
      "by-collection",
      collectionId,
    );

    if (!includeRetired) {
      shoes = shoes.filter((shoe) => !shoe.isRetired);
    }

    return shoes.map(this.stripMetadata);
  }

  async getShoe(id: string): Promise<Shoe | null> {
    const db = this.ensureDB();
    const shoe = await db.get("shoes", id);
    return shoe ? this.stripMetadata(shoe) : null;
  }

  async saveShoe(shoe: Shoe, offline = false): Promise<void> {
    const db = this.ensureDB();
    const enriched = {
      ...shoe,
      _lastModified: Date.now(),
      _offline: offline,
      _syncStatus: offline ? ("pending" as const) : ("synced" as const),
    };
    await db.put("shoes", enriched);

    if (offline) {
      await this.addToSyncQueue("shoes", "update", shoe);
    }
  }

  async deleteShoe(id: string, offline = false): Promise<void> {
    const db = this.ensureDB();
    await db.delete("shoes", id);

    if (offline) {
      await this.addToSyncQueue("shoes", "delete", { id });
    }
  }

  // Runs CRUD operations
  async getRuns(limit = 50, shoeId?: string): Promise<Run[]> {
    const db = this.ensureDB();

    let runs: Run[];
    if (shoeId) {
      runs = await db.getAllFromIndex("runs", "by-shoe", shoeId);
    } else {
      runs = await db.getAll("runs");
    }

    // Sort by date descending and limit
    runs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return runs.slice(0, limit).map(this.stripMetadata);
  }

  async getRun(id: string): Promise<Run | null> {
    const db = this.ensureDB();
    const run = await db.get("runs", id);
    return run ? this.stripMetadata(run) : null;
  }

  async saveRun(run: Run, offline = false): Promise<void> {
    const db = this.ensureDB();
    const enriched = {
      ...run,
      _lastModified: Date.now(),
      _offline: offline,
      _syncStatus: offline ? ("pending" as const) : ("synced" as const),
    };
    await db.put("runs", enriched);

    if (offline) {
      await this.addToSyncQueue("runs", "update", run);
    }
  }

  async deleteRun(id: string, offline = false): Promise<void> {
    const db = this.ensureDB();
    await db.delete("runs", id);

    if (offline) {
      await this.addToSyncQueue("runs", "delete", { id });
    }
  }

  // Sync queue operations
  private async addToSyncQueue(
    table: "collections" | "shoes" | "runs",
    type: "create" | "update" | "delete",
    data: any,
  ): Promise<void> {
    const db = this.ensureDB();
    const id = `${table}_${type}_${data.id || Date.now()}_${Math.random()}`;

    await db.put("syncQueue", {
      id,
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  async getSyncQueue(): Promise<any[]> {
    const db = this.ensureDB();
    return await db.getAll("syncQueue");
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete("syncQueue", id);
  }

  async incrementSyncRetry(id: string, error?: string): Promise<void> {
    const db = this.ensureDB();
    const item = await db.get("syncQueue", id);

    if (item) {
      item.retryCount++;
      item.lastError = error;

      if (item.retryCount >= this.MAX_RETRY_COUNT) {
        console.error(`Max retry count reached for sync item ${id}:`, error);
        // Optionally remove the item or mark it as failed
        await this.removeSyncQueueItem(id);
      } else {
        await db.put("syncQueue", item);
      }
    }
  }

  // Image caching
  async cacheImage(url: string, blob: Blob): Promise<void> {
    const db = this.ensureDB();

    // Check cache size before adding
    await this.manageCacheSize();

    await db.put("imageCache", {
      url,
      blob,
      timestamp: Date.now(),
      size: blob.size,
    });
  }

  async getCachedImage(url: string): Promise<Blob | null> {
    const db = this.ensureDB();
    const cached = await db.get("imageCache", url);

    if (cached) {
      // Update timestamp for LRU
      cached.timestamp = Date.now();
      await db.put("imageCache", cached);
      return cached.blob;
    }

    return null;
  }

  private async manageCacheSize(): Promise<void> {
    const db = this.ensureDB();
    const allImages = await db.getAll("imageCache");

    const totalSize = allImages.reduce((sum, img) => sum + img.size, 0);

    if (totalSize > this.MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first) and remove until under limit
      allImages.sort((a, b) => a.timestamp - b.timestamp);

      let currentSize = totalSize;
      for (const image of allImages) {
        if (currentSize <= this.MAX_CACHE_SIZE * 0.8) break; // Leave 20% buffer

        await db.delete("imageCache", image.url);
        currentSize -= image.size;
      }
    }
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    await db.put("metadata", {
      key,
      value,
      timestamp: Date.now(),
    });
  }

  async getMetadata(key: string): Promise<any> {
    const db = this.ensureDB();
    const metadata = await db.get("metadata", key);
    return metadata?.value;
  }

  // Statistics and analytics
  async getOfflineStats(): Promise<{
    collectionsCount: number;
    shoesCount: number;
    runsCount: number;
    pendingSyncItems: number;
    cacheSize: number;
    lastSync: number | null;
  }> {
    const db = this.ensureDB();

    const [collections, shoes, runs, syncQueue, images] = await Promise.all([
      db.count("collections"),
      db.count("shoes"),
      db.count("runs"),
      db.count("syncQueue"),
      db.getAll("imageCache"),
    ]);

    const cacheSize = images.reduce((sum, img) => sum + img.size, 0);
    const lastSync = await this.getMetadata("lastSyncTime");

    return {
      collectionsCount: collections,
      shoesCount: shoes,
      runsCount: runs,
      pendingSyncItems: syncQueue,
      cacheSize,
      lastSync,
    };
  }

  // Utility methods
  private stripMetadata<T extends Record<string, any>>(
    item: T,
  ): Omit<T, "_lastModified" | "_offline" | "_syncStatus"> {
    const { _lastModified, _offline, _syncStatus, ...clean } = item;
    return clean;
  }

  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(
      ["collections", "shoes", "runs", "syncQueue", "metadata", "imageCache"],
      "readwrite",
    );

    await Promise.all([
      tx.objectStore("collections").clear(),
      tx.objectStore("shoes").clear(),
      tx.objectStore("runs").clear(),
      tx.objectStore("syncQueue").clear(),
      tx.objectStore("metadata").clear(),
      tx.objectStore("imageCache").clear(),
    ]);

    await tx.done;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Bulk operations for sync
  async bulkSaveCollections(collections: Collection[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction("collections", "readwrite");

    await Promise.all(
      collections.map((collection) =>
        tx.store.put({
          ...collection,
          _lastModified: Date.now(),
          _offline: false,
          _syncStatus: "synced" as const,
        }),
      ),
    );

    await tx.done;
  }

  async bulkSaveShoes(shoes: Shoe[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction("shoes", "readwrite");

    await Promise.all(
      shoes.map((shoe) =>
        tx.store.put({
          ...shoe,
          _lastModified: Date.now(),
          _offline: false,
          _syncStatus: "synced" as const,
        }),
      ),
    );

    await tx.done;
  }

  async bulkSaveRuns(runs: Run[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction("runs", "readwrite");

    await Promise.all(
      runs.map((run) =>
        tx.store.put({
          ...run,
          _lastModified: Date.now(),
          _offline: false,
          _syncStatus: "synced" as const,
        }),
      ),
    );

    await tx.done;
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();

// Export types for use in other modules
export type { OfflineDBSchema };

// Initialize the database only in browser environment
if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
  offlineDB.initialize().catch((error) => {
    console.error("Failed to initialize offline database on import:", error);
  });
}
