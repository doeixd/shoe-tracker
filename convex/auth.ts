import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
});

// Setup function to assign seed data to authenticated user
export const setupUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user already has data
    const existingCollections = await ctx.db
      .query("collections")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    if (existingCollections.length > 0) {
      return { alreadySetup: true };
    }

    // Find seed data (data without userId)
    const seedCollections = await ctx.db
      .query("collections")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    const seedShoes = await ctx.db
      .query("shoes")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    const seedRuns = await ctx.db
      .query("runs")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    // Assign collections to user
    for (const collection of seedCollections) {
      await ctx.db.patch(collection._id, { userId });
    }

    // Assign shoes to user
    for (const shoe of seedShoes) {
      await ctx.db.patch(shoe._id, { userId });
    }

    // Assign runs to user
    for (const run of seedRuns) {
      await ctx.db.patch(run._id, { userId });
    }

    return {
      assigned: true,
      collectionsCount: seedCollections.length,
      shoesCount: seedShoes.length,
      runsCount: seedRuns.length,
    };
  },
});

// Force assign all unassigned data to current user (useful for fixing data issues)
export const forceAssignAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find all unassigned data
    const unassignedCollections = await ctx.db
      .query("collections")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    const unassignedShoes = await ctx.db
      .query("shoes")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    const unassignedRuns = await ctx.db
      .query("runs")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    // Assign all to current user
    for (const collection of unassignedCollections) {
      await ctx.db.patch(collection._id, { userId });
    }

    for (const shoe of unassignedShoes) {
      await ctx.db.patch(shoe._id, { userId });
    }

    for (const run of unassignedRuns) {
      await ctx.db.patch(run._id, { userId });
    }

    return {
      message: "All unassigned data has been assigned to current user",
      collectionsAssigned: unassignedCollections.length,
      shoesAssigned: unassignedShoes.length,
      runsAssigned: unassignedRuns.length,
      totalAssigned:
        unassignedCollections.length +
        unassignedShoes.length +
        unassignedRuns.length,
    };
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      return userId;
    } catch (error) {
      // Return null for auth errors instead of throwing
      console.error("Auth error in currentUser:", error);
      return null;
    }
  },
});

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        return null;
      }

      const user = await ctx.db.get(userId);

      // Handle case where user document doesn't exist
      if (!user) {
        console.warn(`User document not found for userId: ${userId}`);
        return null;
      }

      // Return only safe user data
      return {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null,
        _creationTime: user._creationTime,
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  },
});

export const isAuthenticatedQuery = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      return !!userId;
    } catch (error) {
      return false;
    }
  },
});

export const getAuthStatus = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);

      if (!userId) {
        return {
          isAuthenticated: false,
          user: null,
          error: null,
        };
      }

      const user = await ctx.db.get(userId);

      if (!user) {
        return {
          isAuthenticated: false,
          user: null,
          error: "User profile not found",
        };
      }

      return {
        isAuthenticated: true,
        user: {
          _id: user._id,
          name: user.name || null,
          email: user.email || null,
          image: user.image || null,
          _creationTime: user._creationTime,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error in getAuthStatus:", error);
      return {
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : "Authentication error",
      };
    }
  },
});
