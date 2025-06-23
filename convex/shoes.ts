import invariant from "tiny-invariant";
import { v } from "convex/values";
import {
  type QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import {
  createCollectionSchema,
  updateCollectionSchema,
  deleteCollectionSchema,
  createShoeSchema,
  updateShoeSchema,
  deleteShoeSchema,
  createRunSchema,
  updateRunSchema,
  deleteRunSchema,
} from "./schema";
import type { Doc, Id } from "./_generated/dataModel";
import { auth } from "./auth";

// Seed function disabled - app now relies on onboarding flow for user data
// export const seed = internalMutation(async (ctx) => {
//   // Clear existing data first
//   const [existingCollections, existingShoes, existingRuns] = await Promise.all([
//     ctx.db.query("collections").collect(),
//     ctx.db.query("shoes").collect(),
//     ctx.db.query("runs").collect(),
//   ]);

//   for (const run of existingRuns) {
//     await ctx.db.delete(run._id);
//   }
//   for (const shoe of existingShoes) {
//     await ctx.db.delete(shoe._id);
//   }
//   for (const collection of existingCollections) {
//     await ctx.db.delete(collection._id);
//   }

//   // Create sample collections (without userId for now - will be updated when user signs in)
//   const roadRunningId = crypto.randomUUID();
//   const trailRunningId = crypto.randomUUID();
//   const racingId = crypto.randomUUID();

//   await ctx.db.insert("collections", {
//     id: roadRunningId,
//     name: "Road Running",
//     description: "Daily training and long run shoes for pavement",
//     color: "#3b82f6", // blue
//     isArchived: false,
//   });

//   await ctx.db.insert("collections", {
//     id: trailRunningId,
//     name: "Trail Running",
//     description: "Off-road and hiking shoes for trails",
//     color: "#10b981", // green
//     isArchived: false,
//   });

//   await ctx.db.insert("collections", {
//     id: racingId,
//     name: "Racing",
//     description: "Lightweight racing flats and competition shoes",
//     color: "#ef4444", // red
//     isArchived: false,
//   });

//   // Create sample shoes
//   const shoe1Id = crypto.randomUUID();
//   const shoe2Id = crypto.randomUUID();
//   const shoe3Id = crypto.randomUUID();
//   const shoe4Id = crypto.randomUUID();

//   await ctx.db.insert("shoes", {
//     id: shoe1Id,
//     name: "Daily Trainer",
//     model: "Ghost 15",
//     brand: "Brooks",
//     collectionId: roadRunningId,
//     maxMileage: 500,
//     currentMileage: 125,
//     purchaseDate: "2024-01-15",
//     purchasePrice: 140,
//     size: "10.5",
//     weight: 280,
//     dropHeight: 12,
//     notes: "Great for daily miles, very comfortable",
//     isRetired: false,
//     createdAt: Date.now() - 86400000 * 30, // 30 days ago
//   });

//   await ctx.db.insert("shoes", {
//     id: shoe2Id,
//     name: "Long Run Shoe",
//     model: "Gel-Nimbus 25",
//     brand: "ASICS",
//     collectionId: roadRunningId,
//     maxMileage: 400,
//     currentMileage: 87,
//     purchaseDate: "2024-02-01",
//     purchasePrice: 160,
//     size: "10.5",
//     weight: 295,
//     dropHeight: 13,
//     notes: "Maximum cushioning for long runs",
//     isRetired: false,
//     createdAt: Date.now() - 86400000 * 20, // 20 days ago
//   });

//   await ctx.db.insert("shoes", {
//     id: shoe3Id,
//     name: "Trail Beast",
//     model: "Speedgoat 5",
//     brand: "HOKA",
//     collectionId: trailRunningId,
//     maxMileage: 450,
//     currentMileage: 203,
//     purchaseDate: "2023-12-10",
//     purchasePrice: 155,
//     size: "10.5",
//     weight: 315,
//     dropHeight: 4,
//     notes: "Excellent grip on technical trails",
//     isRetired: false,
//     createdAt: Date.now() - 86400000 * 60, // 60 days ago
//   });

//   await ctx.db.insert("shoes", {
//     id: shoe4Id,
//     name: "Race Day",
//     model: "Vaporfly Next% 2",
//     brand: "Nike",
//     collectionId: racingId,
//     maxMileage: 200,
//     currentMileage: 45,
//     purchaseDate: "2024-01-20",
//     purchasePrice: 250,
//     size: "10.5",
//     weight: 196,
//     dropHeight: 8,
//     notes: "Only for races and tempo runs",
//     isRetired: false,
//     createdAt: Date.now() - 86400000 * 25, // 25 days ago
//   });

//   // Create sample runs
//   const runs = [
//     {
//       id: crypto.randomUUID(),
//       date: "2024-01-22",
//       distance: 6.2,
//       duration: 45,
//       pace: "7:15",
//       shoeId: shoe1Id,
//       runType: "outdoor",
//       surface: "road",
//       effort: "easy",
//       weather: "clear",
//       temperature: 55,
//       notes: "Easy morning run, felt great",
//       createdAt: Date.now() - 86400000 * 3,
//     },
//     {
//       id: crypto.randomUUID(),
//       date: "2024-01-21",
//       distance: 12.0,
//       duration: 95,
//       pace: "7:55",
//       shoeId: shoe2Id,
//       runType: "outdoor",
//       surface: "road",
//       effort: "moderate",
//       weather: "overcast",
//       temperature: 48,
//       notes: "Long run prep for marathon training",
//       elevation: 245,
//       heartRate: 145,
//       calories: 980,
//       createdAt: Date.now() - 86400000 * 4,
//     },
//     {
//       id: crypto.randomUUID(),
//       date: "2024-01-20",
//       distance: 8.5,
//       duration: 75,
//       pace: "8:50",
//       shoeId: shoe3Id,
//       runType: "outdoor",
//       surface: "trail",
//       effort: "moderate",
//       weather: "sunny",
//       temperature: 62,
//       notes: "Beautiful trail run in the mountains",
//       elevation: 850,
//       heartRate: 155,
//       calories: 720,
//       createdAt: Date.now() - 86400000 * 5,
//     },
//   ];

//   for (const run of runs) {
//     await ctx.db.insert("runs", run);
//   }

//   console.log("Seed data created successfully!");
// });

// Function to assign seed data to a newly authenticated user - DISABLED
// export const assignSeedDataToUser = internalMutation({
//   args: { userId: v.id("users") },
//   handler: async (ctx, { userId }) => {
//     // Check if user already has data
//     const existingCollections = await ctx.db
//       .query("collections")
//       .withIndex("userId", (q) => q.eq("userId", userId))
//       .collect();

//     if (existingCollections.length > 0) {
//       console.log(`User ${userId} already has collections`);
//       return;
//     }

//     // Find seed data (data without userId)
//     const seedCollections = await ctx.db
//       .query("collections")
//       .filter((q) => q.eq(q.field("userId"), undefined))
//       .collect();

//     const seedShoes = await ctx.db
//       .query("shoes")
//       .filter((q) => q.eq(q.field("userId"), undefined))
//       .collect();

//     const seedRuns = await ctx.db
//       .query("runs")
//       .filter((q) => q.eq(q.field("userId"), undefined))
//       .collect();

//     if (seedCollections.length === 0) {
//       console.log("No seed data found");
//       return;
//     }

//     // Assign collections to user
//     for (const collection of seedCollections) {
//       await ctx.db.patch(collection._id, { userId });
//     }

//     // Assign shoes to user
//     for (const shoe of seedShoes) {
//       await ctx.db.patch(shoe._id, { userId });
//     }

//     // Assign runs to user
//     for (const run of seedRuns) {
//       await ctx.db.patch(run._id, { userId });
//     }

//     console.log(`Assigned seed data to user ${userId}`);
//   },
// });

// Clear all data (for development)
export const clear = internalMutation(async (ctx) => {
  // Clear all data for all users (development only)
  const [collections, shoes, runs] = await Promise.all([
    ctx.db.query("collections").collect(),
    ctx.db.query("shoes").collect(),
    ctx.db.query("runs").collect(),
  ]);

  for (const run of runs) {
    await ctx.db.delete(run._id);
  }
  for (const shoe of shoes) {
    await ctx.db.delete(shoe._id);
  }
  for (const collection of collections) {
    await ctx.db.delete(collection._id);
  }
});

function withoutSystemFields<T extends { _creationTime: number; _id: Id<any> }>(
  doc: T,
) {
  const { _id, _creationTime, ...rest } = doc;
  return rest;
}

// Helper functions
async function ensureCollectionExists(
  ctx: QueryCtx,
  collectionId: string,
  userId?: string,
): Promise<Doc<"collections">> {
  const collection = await ctx.db
    .query("collections")
    .withIndex("id", (q) => q.eq("id", collectionId))
    .unique();

  if (!collection) {
    throw new Error(`Collection not found: ${collectionId}`);
  }

  // If userId is provided, check ownership or assign if unassigned
  if (userId) {
    if (collection.userId && collection.userId !== userId) {
      throw new Error(`Collection ${collectionId} access denied`);
    }

    // If no userId assigned, allow access but don't auto-assign in query
    if (!collection.userId) {
      return collection;
    }
  }

  return collection;
}

async function ensureShoeExists(
  ctx: QueryCtx,
  shoeId: string,
  userId?: string,
): Promise<Doc<"shoes">> {
  const shoe = await ctx.db
    .query("shoes")
    .withIndex("id", (q) => q.eq("id", shoeId))
    .unique();

  if (!shoe) {
    throw new Error(`Shoe not found: ${shoeId}`);
  }

  // If userId is provided, check ownership or assign if unassigned
  if (userId) {
    if (shoe.userId && shoe.userId !== userId) {
      throw new Error(`Shoe ${shoeId} access denied`);
    }

    // If no userId assigned, allow access but don't auto-assign in query
    if (!shoe.userId) {
      return shoe;
    }
  }

  return shoe;
}

async function ensureRunExists(
  ctx: QueryCtx,
  runId: string,
  userId?: string,
): Promise<Doc<"runs">> {
  const run = await ctx.db
    .query("runs")
    .withIndex("id", (q) => q.eq("id", runId))
    .unique();

  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  // If userId is provided, check ownership or assign if unassigned
  if (userId) {
    if (run.userId && run.userId !== userId) {
      throw new Error(`Run ${runId} access denied`);
    }

    // If no userId assigned, allow access but don't auto-assign in query
    if (!run.userId) {
      return run;
    }
  }

  return run;
}

// Debug test queries
export const testDataAvailability = query({
  args: {},
  handler: async (ctx) => {
    // Get all data regardless of user for debugging
    const allCollections = await ctx.db.query("collections").collect();
    const allShoes = await ctx.db.query("shoes").collect();
    const allRuns = await ctx.db.query("runs").collect();

    return {
      totalCollections: allCollections.length,
      totalShoes: allShoes.length,
      totalRuns: allRuns.length,
      collectionsWithoutUser: allCollections.filter((c) => !c.userId).length,
      shoesWithoutUser: allShoes.filter((s) => !s.userId).length,
      runsWithoutUser: allRuns.filter((r) => !r.userId).length,
      sampleCollection: allCollections[0] || null,
      sampleShoe: allShoes[0] || null,
    };
  },
});

export const testUserAuth = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      return {
        isAuthenticated: !!userId,
        userId: userId || null,
        error: null,
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        userId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const testUserData = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        return {
          error: "Not authenticated",
          userCollections: 0,
          userShoes: 0,
          userRuns: 0,
        };
      }

      const userCollections = await ctx.db
        .query("collections")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      const userShoes = await ctx.db
        .query("shoes")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      const userRuns = await ctx.db
        .query("runs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      return {
        userId,
        userCollections: userCollections.length,
        userShoes: userShoes.length,
        userRuns: userRuns.length,
        collections: userCollections.map(withoutSystemFields),
        shoes: userShoes.map(withoutSystemFields),
        error: null,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        userCollections: 0,
        userShoes: 0,
        userRuns: 0,
      };
    }
  },
});

// Collection queries and mutations
export const getCollections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const collections = await ctx.db
      .query("collections")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();

    return collections.map(withoutSystemFields);
  },
});

export const getArchivedCollections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const collections = await ctx.db
      .query("collections")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isArchived"), true))
      .collect();

    return collections.map(withoutSystemFields);
  },
});

export const getCollection = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // First try to find the collection
    const collection = await ctx.db
      .query("collections")
      .withIndex("id", (q) => q.eq("id", id))
      .unique();

    if (!collection) {
      throw new Error(`Collection not found: ${id}`);
    }

    // Check if user owns this collection or if it's unassigned seed data
    if (collection.userId && collection.userId !== userId) {
      throw new Error(`Collection ${id} access denied`);
    }

    // If collection exists but has no userId (seed data), allow access
    if (!collection.userId) {
      return withoutSystemFields(collection);
    }

    return withoutSystemFields(collection);
  },
});

export const createCollection = mutation({
  args: createCollectionSchema,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const id = crypto.randomUUID();
    await ctx.db.insert("collections", {
      ...args,
      id,
      isArchived: false,
      userId,
    });
    return id;
  },
});

export const updateCollection = mutation({
  args: updateCollectionSchema,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const collection = await ensureCollectionExists(ctx, args.id, userId);
    await ctx.db.patch(collection._id, args);
  },
});

export const deleteCollection = mutation({
  args: deleteCollectionSchema,
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const collection = await ensureCollectionExists(ctx, id, userId);

    // Check if there are shoes in this collection belonging to this user
    const shoes = await ctx.db
      .query("shoes")
      .withIndex("collection", (q) => q.eq("collectionId", id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    if (shoes.length > 0) {
      throw new Error(
        "Cannot delete collection with shoes. Move or delete shoes first.",
      );
    }

    await ctx.db.delete(collection._id);
  },
});

export const archiveCollection = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const collection = await ensureCollectionExists(ctx, id, userId);
    await ctx.db.patch(collection._id, { isArchived: true });
  },
});

// Shoe queries and mutations
export const getShoes = query({
  args: { includeRetired: v.optional(v.boolean()) },
  handler: async (ctx, { includeRetired = false }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let query = ctx.db
      .query("shoes")
      .withIndex("userId", (q) => q.eq("userId", userId));

    let shoes = await query.collect();

    if (!includeRetired) {
      shoes = shoes.filter((shoe) => !shoe.isRetired);
    }

    return shoes.map(withoutSystemFields);
  },
});

export const getShoesByCollection = query({
  args: {
    collectionId: v.string(),
    includeRetired: v.optional(v.boolean()),
  },
  handler: async (ctx, { collectionId, includeRetired = false }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let shoes = await ctx.db
      .query("shoes")
      .withIndex("collection", (q) => q.eq("collectionId", collectionId))
      .collect();

    // Filter by user
    shoes = shoes.filter((shoe) => shoe.userId === userId);

    if (!includeRetired) {
      shoes = shoes.filter((shoe) => !shoe.isRetired);
    }

    return shoes.map(withoutSystemFields);
  },
});

export const getShoe = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, id, userId);
    return withoutSystemFields(shoe);
  },
});

export const getShoeWithStats = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, id, userId);

    // Get runs for this shoe that belong to this user
    const runs = await ctx.db
      .query("runs")
      .withIndex("shoe", (q) => q.eq("shoeId", id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Calculate stats
    const totalRuns = runs.length;
    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = runs.reduce(
      (sum, run) => sum + (run.duration || 0),
      0,
    );
    const avgPace =
      totalDuration > 0 && totalDistance > 0
        ? Math.round(totalDuration / totalDistance)
        : null;

    // Calculate usage level
    const currentMileage = shoe.currentMileage || totalDistance;
    const usagePercentage = (currentMileage / shoe.maxMileage) * 100;
    let usageLevel: "new" | "good" | "moderate" | "high" | "replace";

    if (usagePercentage < 25) usageLevel = "new";
    else if (usagePercentage < 50) usageLevel = "good";
    else if (usagePercentage < 75) usageLevel = "moderate";
    else if (usagePercentage < 90) usageLevel = "high";
    else usageLevel = "replace";

    return {
      ...withoutSystemFields(shoe),
      stats: {
        totalRuns,
        totalDistance,
        totalDuration,
        avgPace,
        currentMileage,
        usagePercentage,
        usageLevel,
        milesRemaining: Math.max(0, shoe.maxMileage - currentMileage),
      },
      recentRuns: runs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map(withoutSystemFields),
    };
  },
});

export const createShoe = mutation({
  args: createShoeSchema,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const collection = await ensureCollectionExists(
      ctx,
      args.collectionId,
      userId,
    );

    const id = crypto.randomUUID();
    await ctx.db.insert("shoes", {
      ...args,
      id,
      currentMileage: 0,
      isRetired: false,
      createdAt: Date.now(),
      userId,
    });
    return id;
  },
});

export const updateShoe = mutation({
  args: updateShoeSchema,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, args.id, userId);

    if (args.collectionId) {
      await ensureCollectionExists(ctx, args.collectionId, userId);
    }

    await ctx.db.patch(shoe._id, args);
  },
});

export const retireShoe = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, id, userId);
    await ctx.db.patch(shoe._id, {
      isRetired: true,
      retiredDate: new Date().toISOString().split("T")[0],
    });
  },
});

export const deleteShoe = mutation({
  args: deleteShoeSchema,
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, id, userId);

    // Delete all runs associated with this shoe that belong to this user
    const runs = await ctx.db
      .query("runs")
      .withIndex("shoe", (q) => q.eq("shoeId", id))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const run of runs) {
      await ctx.db.delete(run._id);
    }

    await ctx.db.delete(shoe._id);
  },
});

// Run queries and mutations
export const getRuns = query({
  args: {
    limit: v.optional(v.number()),
    shoeId: v.optional(v.string()),
  },
  handler: async (ctx, { limit = 50, shoeId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let runs;
    if (shoeId) {
      runs = await ctx.db
        .query("runs")
        .withIndex("shoe", (q) => q.eq("shoeId", shoeId))
        .order("desc")
        .take(limit);
      // Filter by user
      runs = runs.filter((run) => run.userId === userId);
    } else {
      runs = await ctx.db
        .query("runs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    }

    return runs.map(withoutSystemFields);
  },
});

export const getRun = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const run = await ensureRunExists(ctx, id, userId);
    return withoutSystemFields(run);
  },
});

export const getRunsWithShoes = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const runs = await ctx.db
      .query("runs")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    const runsWithShoes = await Promise.all(
      runs.map(async (run) => {
        const shoe = await ctx.db
          .query("shoes")
          .withIndex("id", (q) => q.eq("id", run.shoeId))
          .filter((q) => q.eq(q.field("userId"), userId))
          .unique();

        return {
          ...withoutSystemFields(run),
          shoe: shoe ? withoutSystemFields(shoe) : null,
        };
      }),
    );

    return runsWithShoes;
  },
});

export const createRun = mutation({
  args: createRunSchema,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, args.shoeId, userId);

    const id = crypto.randomUUID();
    await ctx.db.insert("runs", {
      ...args,
      id,
      createdAt: Date.now(),
      userId,
    });

    // Update shoe's current mileage
    const currentMileage = (shoe.currentMileage || 0) + args.distance;
    await ctx.db.patch(shoe._id, { currentMileage });

    return id;
  },
});

export const updateRun = mutation({
  args: updateRunSchema,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const run = await ensureRunExists(ctx, args.id, userId);

    if (args.shoeId && args.shoeId !== run.shoeId) {
      const newShoe = await ensureShoeExists(ctx, args.shoeId, userId);

      // Update mileage for old and new shoes
      const oldShoe = await ensureShoeExists(ctx, run.shoeId, userId);

      const oldDistance = run.distance;
      const newDistance = args.distance || run.distance;

      // Remove distance from old shoe
      const oldShoeNewMileage = Math.max(
        0,
        (oldShoe.currentMileage || 0) - oldDistance,
      );
      await ctx.db.patch(oldShoe._id, { currentMileage: oldShoeNewMileage });

      // Add distance to new shoe
      const newShoeNewMileage = (newShoe.currentMileage || 0) + newDistance;
      await ctx.db.patch(newShoe._id, { currentMileage: newShoeNewMileage });
    } else if (args.distance && args.distance !== run.distance) {
      // Update mileage for distance change on same shoe
      const shoe = await ensureShoeExists(ctx, run.shoeId, userId);
      const mileageDiff = args.distance - run.distance;
      const newMileage = Math.max(0, (shoe.currentMileage || 0) + mileageDiff);
      await ctx.db.patch(shoe._id, { currentMileage: newMileage });
    }

    await ctx.db.patch(run._id, args);
  },
});

export const deleteRun = mutation({
  args: deleteRunSchema,
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const run = await ensureRunExists(ctx, id, userId);
    const shoe = await ensureShoeExists(ctx, run.shoeId, userId);

    // Remove distance from shoe's mileage
    const newMileage = Math.max(0, (shoe.currentMileage || 0) - run.distance);
    await ctx.db.patch(shoe._id, { currentMileage: newMileage });

    await ctx.db.delete(run._id);
  },
});

// Statistics queries
export const getOverallStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const [collections, shoes, runs] = await Promise.all([
      ctx.db
        .query("collections")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("shoes")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("runs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const activeShoes = shoes.filter((shoe) => !shoe.isRetired);
    const retiredShoes = shoes.filter((shoe) => shoe.isRetired);

    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalRuns = runs.length;
    const totalDuration = runs.reduce(
      (sum, run) => sum + (run.duration || 0),
      0,
    );

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthRuns = runs.filter((run) => new Date(run.date) >= thisMonth);
    const monthlyDistance = thisMonthRuns.reduce(
      (sum, run) => sum + run.distance,
      0,
    );
    const monthlyRuns = thisMonthRuns.length;

    return {
      totalCollections: collections.length,
      totalShoes: shoes.length,
      activeShoes: activeShoes.length,
      retiredShoes: retiredShoes.length,
      totalRuns,
      totalDistance,
      totalDuration,
      avgDistance: totalRuns > 0 ? totalDistance / totalRuns : 0,
      monthlyRuns,
      monthlyDistance,
      shoesNeedingReplacement: activeShoes.filter((shoe) => {
        const currentMileage = shoe.currentMileage || 0;
        return currentMileage / shoe.maxMileage >= 0.9;
      }).length,
    };
  },
});

// Image upload support with robust error handling
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      return await ctx.storage.generateUploadUrl();
    } catch (error) {
      console.error("Error generating upload URL:", error);
      throw new Error("Failed to generate upload URL. Please try again.");
    }
  },
});

export const updateShoeImage = mutation({
  args: {
    shoeId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { shoeId, storageId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, shoeId, userId);

    try {
      // Get the URL for the uploaded image
      const imageUrl = await ctx.storage.getUrl(storageId);
      if (!imageUrl) {
        throw new Error("Uploaded file not found or failed to generate URL");
      }

      // Delete old image if it exists
      if (shoe.imageStorageId) {
        try {
          await ctx.storage.delete(shoe.imageStorageId);
        } catch (deleteError) {
          console.warn("Failed to delete old image:", deleteError);
          // Don't fail the update if old image deletion fails
        }
      }

      await ctx.db.patch(shoe._id, {
        imageStorageId: storageId,
        imageUrl: imageUrl,
      });

      return { success: true, imageUrl };
    } catch (error) {
      console.error("Error updating shoe image:", error);
      throw new Error("Failed to update shoe image. Please try again.");
    }
  },
});

export const deleteShoeImage = mutation({
  args: {
    shoeId: v.string(),
  },
  handler: async (ctx, { shoeId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const shoe = await ensureShoeExists(ctx, shoeId, userId);

    if (!shoe.imageStorageId) {
      return { success: true, message: "No image to delete" };
    }

    try {
      // Delete the file from storage
      await ctx.storage.delete(shoe.imageStorageId);

      // Update the shoe record
      await ctx.db.patch(shoe._id, {
        imageStorageId: undefined,
        imageUrl: undefined,
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting shoe image:", error);
      throw new Error("Failed to delete image. Please try again.");
    }
  },
});

export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      // Get the URL for the image
      const url = await ctx.storage.getUrl(storageId);
      if (!url) {
        return null;
      }
      return url;
    } catch (error) {
      console.error("Error getting image URL:", error);
      return null;
    }
  },
});

export const validateImageUpload = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    try {
      const url = await ctx.storage.getUrl(storageId);
      if (!url) {
        throw new Error("File not found");
      }

      const file = await fetch(url);

      const blob = await file.blob();

      // Validate file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (blob.size > MAX_FILE_SIZE) {
        await ctx.storage.delete(storageId);
        throw new Error("File too large. Maximum size is 10MB.");
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(blob.type)) {
        await ctx.storage.delete(storageId);
        throw new Error(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        );
      }

      return { valid: true, fileSize: blob.size, fileType: blob.type };
    } catch (error) {
      console.error("Error validating image upload:", error);
      throw error;
    }
  },
});
