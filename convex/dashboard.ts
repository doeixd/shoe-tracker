import { query } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";

/**
 * Batched dashboard query that fetches all dashboard data in a single request
 * This eliminates waterfall loading and improves performance significantly
 */
export const getDashboardData = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Fetch all dashboard data in parallel using Promise.all
    // Convex automatically optimizes these parallel queries
    const [collections, shoes, runs, allRuns] = await Promise.all([
      // Get collections
      ctx.db
        .query("collections")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .filter((q) => q.neq(q.field("isArchived"), true))
        .collect(),

      // Get all shoes (including retired for stats)
      ctx.db
        .query("shoes")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),

      // Get recent runs with shoe data (limit 10 for dashboard)
      ctx.db
        .query("runs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .order("desc")
        .take(10),

      // Get all runs for stats calculation (server-side aggregation)
      ctx.db
        .query("runs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    // Calculate overall stats server-side instead of client-side
    const totalRuns = allRuns.length;
    const totalDistance = allRuns.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = allRuns.reduce(
      (sum, run) => sum + (run.duration || 0),
      0,
    );

    // Calculate monthly stats (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRuns = allRuns.filter((run) => {
      const runDate = new Date(run.date);
      return (
        runDate.getMonth() === currentMonth &&
        runDate.getFullYear() === currentYear
      );
    });

    const monthlyDistance = monthlyRuns.reduce(
      (sum, run) => sum + run.distance,
      0,
    );

    // Calculate shoe stats
    const activeShoes = shoes.filter((shoe) => !shoe.isRetired);
    const retiredShoes = shoes.filter((shoe) => shoe.isRetired);

    // Find shoes needing replacement (>90% of max mileage)
    const shoesNeedingReplacement = activeShoes
      .filter((shoe) => {
        const shoeRuns = allRuns.filter((run) => run.shoeId === shoe.id);
        const currentMileage = shoeRuns.reduce(
          (sum, run) => sum + run.distance,
          0,
        );
        return currentMileage / shoe.maxMileage > 0.9;
      })
      .map((shoe) => {
        const shoeRuns = allRuns.filter((run) => run.shoeId === shoe.id);
        const currentMileage = shoeRuns.reduce(
          (sum, run) => sum + run.distance,
          0,
        );
        return {
          id: shoe.id,
          name: shoe.name,
          model: shoe.model,
          brand: shoe.brand,
          collectionId: shoe.collectionId,
          maxMileage: shoe.maxMileage,
          currentMileage,
          usagePercentage: (currentMileage / shoe.maxMileage) * 100,
        };
      });

    // Calculate average distance per run
    const avgDistance = totalRuns > 0 ? totalDistance / totalRuns : 0;

    // Get recent runs with their shoe information
    const recentRunsWithShoes = await Promise.all(
      runs.map(async (run) => {
        const shoe = shoes.find((s) => s.id === run.shoeId);
        return {
          ...run,
          shoe: shoe || null,
        };
      }),
    );

    return {
      stats: {
        totalCollections: collections.length,
        totalShoes: shoes.length,
        activeShoes: activeShoes.length,
        retiredShoes: retiredShoes.length,
        totalRuns,
        totalDistance,
        totalDuration,
        avgDistance,
        monthlyRuns: monthlyRuns.length,
        monthlyDistance,
        shoesNeedingReplacement: shoesNeedingReplacement.length,
      },
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        color: collection.color,
        isArchived: collection.isArchived,
      })),
      shoes: shoes.map((shoe) => ({
        id: shoe.id,
        name: shoe.name,
        model: shoe.model,
        brand: shoe.brand,
        collectionId: shoe.collectionId,
        imageUrl: shoe.imageUrl,
        imageStorageId: shoe.imageStorageId,
        purchaseDate: shoe.purchaseDate,
        purchasePrice: shoe.purchasePrice,
        maxMileage: shoe.maxMileage,
        currentMileage: shoe.currentMileage,
        notes: shoe.notes,
        isRetired: shoe.isRetired,
        retiredDate: shoe.retiredDate,
        size: shoe.size,
        weight: shoe.weight,
        dropHeight: shoe.dropHeight,
        createdAt: shoe.createdAt,
      })),
      recentRuns: recentRunsWithShoes.map((run) => ({
        id: run.id,
        date: run.date,
        distance: run.distance,
        duration: run.duration,
        pace: run.pace,
        shoeId: run.shoeId,
        runType: run.runType,
        surface: run.surface,
        effort: run.effort,
        weather: run.weather,
        temperature: run.temperature,
        notes: run.notes,
        route: run.route,
        elevation: run.elevation,
        heartRate: run.heartRate,
        calories: run.calories,
        createdAt: run.createdAt,
        shoe: run.shoe,
      })),
      shoesNeedingReplacement,
    };
  },
});

/**
 * Lightweight dashboard query for quick stats only
 * Use this when you only need stats without full data
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get counts efficiently
    const [collectionsCount, shoesCount, runsCount, allRuns, allShoes] =
      await Promise.all([
        ctx.db
          .query("collections")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .filter((q) => q.neq(q.field("isArchived"), true))
          .collect()
          .then((collections) => collections.length),

        ctx.db
          .query("shoes")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .collect()
          .then((shoes) => shoes.length),

        ctx.db
          .query("runs")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .collect()
          .then((runs) => runs.length),

        // Get runs for aggregation
        ctx.db
          .query("runs")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .collect(),

        // Get shoes for retirement calculation
        ctx.db
          .query("shoes")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .collect(),
      ]);

    // Calculate aggregated stats
    const totalDistance = allRuns.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = allRuns.reduce(
      (sum, run) => sum + (run.duration || 0),
      0,
    );

    // Monthly stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRuns = allRuns.filter((run) => {
      const runDate = new Date(run.date);
      return (
        runDate.getMonth() === currentMonth &&
        runDate.getFullYear() === currentYear
      );
    });

    const monthlyDistance = monthlyRuns.reduce(
      (sum, run) => sum + run.distance,
      0,
    );

    // Shoe stats
    const activeShoes = allShoes.filter((shoe) => !shoe.isRetired);
    const retiredShoes = allShoes.filter((shoe) => shoe.isRetired);

    // Shoes needing replacement
    const shoesNeedingReplacement = activeShoes.filter((shoe) => {
      const shoeRuns = allRuns.filter((run) => run.shoeId === shoe.id);
      const currentMileage = shoeRuns.reduce(
        (sum, run) => sum + run.distance,
        0,
      );
      return currentMileage / shoe.maxMileage > 0.9;
    });

    return {
      totalCollections: collectionsCount,
      totalShoes: shoesCount,
      activeShoes: activeShoes.length,
      retiredShoes: retiredShoes.length,
      totalRuns: runsCount,
      totalDistance,
      totalDuration,
      avgDistance: runsCount > 0 ? totalDistance / runsCount : 0,
      monthlyRuns: monthlyRuns.length,
      monthlyDistance,
      shoesNeedingReplacement: shoesNeedingReplacement.length,
    };
  },
});

/**
 * Comprehensive app data query for instant loading across all routes
 * This query provides all data needed for the entire app to eliminate loading states
 */
export const getAppData = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Fetch all app data in parallel for maximum performance
    const [collections, archivedCollections, shoes, allRuns] =
      await Promise.all([
        // Get active collections
        ctx.db
          .query("collections")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .filter((q) => q.neq(q.field("isArchived"), true))
          .collect(),

        // Get archived collections
        ctx.db
          .query("collections")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .filter((q) => q.eq(q.field("isArchived"), true))
          .collect(),

        // Get all shoes
        ctx.db
          .query("shoes")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .collect(),

        // Get all runs
        ctx.db
          .query("runs")
          .withIndex("userId", (q) => q.eq("userId", userId))
          .order("desc")
          .collect(),
      ]);

    // Calculate comprehensive stats
    const totalRuns = allRuns.length;
    const totalDistance = allRuns.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = allRuns.reduce(
      (sum, run) => sum + (run.duration || 0),
      0,
    );

    // Monthly stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRuns = allRuns.filter((run) => {
      const runDate = new Date(run.date);
      return (
        runDate.getMonth() === currentMonth &&
        runDate.getFullYear() === currentYear
      );
    });

    const monthlyDistance = monthlyRuns.reduce(
      (sum, run) => sum + run.distance,
      0,
    );

    // Shoe calculations
    const activeShoes = shoes.filter((shoe) => !shoe.isRetired);
    const retiredShoes = shoes.filter((shoe) => shoe.isRetired);

    // Calculate current mileage for each shoe
    const shoesWithMileage = shoes.map((shoe) => {
      const shoeRuns = allRuns.filter((run) => run.shoeId === shoe.id);
      const currentMileage = shoeRuns.reduce(
        (sum, run) => sum + run.distance,
        0,
      );
      return {
        ...shoe,
        currentMileage,
        usagePercentage: (currentMileage / shoe.maxMileage) * 100,
      };
    });

    // Shoes needing replacement
    const shoesNeedingReplacement = shoesWithMileage.filter(
      (shoe) => !shoe.isRetired && shoe.usagePercentage > 90,
    );

    // Recent runs with shoe info (limit for dashboard)
    const recentRuns = allRuns.slice(0, 20).map((run) => {
      const shoe = shoes.find((s) => s.id === run.shoeId);
      return {
        ...run,
        shoe: shoe || null,
      };
    });

    // Calculate collection stats
    const collectionsWithStats = collections.map((collection) => {
      const collectionShoes = shoes.filter(
        (shoe) => shoe.collectionId === collection.id,
      );
      const collectionRuns = allRuns.filter((run) => {
        const shoe = shoes.find((s) => s.id === run.shoeId);
        return shoe?.collectionId === collection.id;
      });

      return {
        ...collection,
        shoeCount: collectionShoes.length,
        runCount: collectionRuns.length,
        totalDistance: collectionRuns.reduce(
          (sum, run) => sum + run.distance,
          0,
        ),
      };
    });

    return {
      // Core data for all routes
      collections: collectionsWithStats,
      archivedCollections,
      shoes: shoesWithMileage,
      runs: recentRuns,
      allRuns, // Full run history for analytics

      // Computed stats
      stats: {
        totalCollections: collections.length,
        totalShoes: shoes.length,
        activeShoes: activeShoes.length,
        retiredShoes: retiredShoes.length,
        totalRuns,
        totalDistance,
        totalDuration,
        avgDistance: totalRuns > 0 ? totalDistance / totalRuns : 0,
        monthlyRuns: monthlyRuns.length,
        monthlyDistance,
        shoesNeedingReplacement: shoesNeedingReplacement.length,
      },

      // Alerts and recommendations
      shoesNeedingReplacement,

      // Metadata
      lastUpdated: Date.now(),
    };
  },
});

/**
 * Quick check if user has any data - used for onboarding flow
 */
export const hasUserData = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { hasAnyData: false };
    }

    const [hasCollections, hasShoes, hasRuns] = await Promise.all([
      ctx.db
        .query("collections")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first()
        .then((result) => !!result),

      ctx.db
        .query("shoes")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first()
        .then((result) => !!result),

      ctx.db
        .query("runs")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .first()
        .then((result) => !!result),
    ]);

    return {
      hasCollections,
      hasShoes,
      hasRuns,
      hasAnyData: hasCollections || hasShoes || hasRuns,
    };
  },
});
