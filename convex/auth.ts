import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Auth debugging utilities for server-side logging
const DEBUG_PREFIX = "[CONVEX_AUTH]";
const isProduction = process.env.NODE_ENV === "production";
// Force production logging for debugging auth issues
const FORCE_PRODUCTION_LOGGING = true;

interface AuthServerDebugEvent {
  timestamp: number;
  event: string;
  data?: any;
  level: "debug" | "info" | "warn" | "error";
  userId?: string;
}

// Server-side debug logging
function authServerLog(
  level: "debug" | "info" | "warn" | "error",
  event: string,
  data?: any,
  userId?: string,
) {
  const timestamp = Date.now();

  // Sanitize data for production
  const sanitizedData = isProduction
    ? {
        error:
          typeof data?.error === "string" ? data.error : data?.error?.message,
        type: data?.type || data?.errorType,
        userId: userId ? `${userId.slice(0, 8)}...` : undefined,
      }
    : data;

  const logMessage = `${DEBUG_PREFIX} ${event}`;
  const logData = sanitizedData ? ` - ${JSON.stringify(sanitizedData)}` : "";

  if (!isProduction) {
    // Verbose logging in development
    switch (level) {
      case "debug":
        console.debug(logMessage + logData);
        break;
      case "info":
        console.info(logMessage + logData);
        break;
      case "warn":
        console.warn(logMessage + logData);
        break;
      case "error":
        console.error(logMessage + logData);
        break;
    }
  } else if (
    FORCE_PRODUCTION_LOGGING ||
    level === "warn" ||
    level === "error"
  ) {
    // Enhanced production logging for debugging
    const prodMessage = `${logMessage} [ENV:${isProduction ? "PROD" : "DEV"}]${logData}`;

    switch (level) {
      case "debug":
        console.log(prodMessage);
        break;
      case "info":
        console.info(prodMessage);
        break;
      case "warn":
        console.warn(prodMessage);
        break;
      case "error":
        console.error(prodMessage);
        break;
    }
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});

// Setup function to assign seed data to authenticated user
export const setupUserData = mutation({
  handler: async (ctx) => {
    const startTime = Date.now();
    authServerLog("info", "setup_user_data_started");

    try {
      authServerLog("debug", "setup_user_data_getting_user_id");
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        authServerLog("error", "setup_user_data_not_authenticated", {
          context: "setupUserData",
          hasAuth: !!auth,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Not authenticated");
      }

      authServerLog("info", "setup_user_data_user_identified", {
        userId: `${userId.slice(0, 8)}...`,
        timestamp: new Date().toISOString(),
      });

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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authServerLog("error", "setup_user_data_error", {
        error: error?.message,
        type: error?.name,
        duration,
        stack: error?.stack?.slice(0, 200),
        timestamp: new Date().toISOString(),
        context: "setupUserData",
      });
      throw error;
    }
  },
});

// Force assign all unassigned data to current user (useful for fixing data issues)
// Function to force assign all data to authenticated user (admin use)
export const forceAssignAllData = mutation({
  handler: async (ctx) => {
    const startTime = Date.now();
    authServerLog("warn", "force_assign_all_data_started");

    try {
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        authServerLog("error", "force_assign_all_data_not_authenticated");
        throw new Error("Not authenticated");
      }

      authServerLog("warn", "force_assign_all_data_user_identified", {
        userId: `${userId.slice(0, 8)}...`,
      });

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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authServerLog("error", "force_assign_all_data_error", {
        error: error?.message,
        type: error?.name,
        duration,
        stack: error?.stack?.slice(0, 200),
        timestamp: new Date().toISOString(),
        context: "forceAssignAllData",
      });
      throw error;
    }
  },
});

// Helper to get current user ID, returns null if not authenticated
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      authServerLog("debug", "current_user_getting_user_id");
      const userId = await auth.getUserId(ctx);
      authServerLog("info", "current_user_success", {
        hasUserId: !!userId,
        userId: userId ? `${userId.slice(0, 8)}...` : null,
        timestamp: new Date().toISOString(),
      });
      return userId;
    } catch (error: any) {
      // Return null for auth errors instead of throwing
      authServerLog("error", "current_user_auth_error", {
        error: error?.message,
        type: error?.name,
        stack: error?.stack?.slice(0, 200),
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  },
});

// Get user profile with error handling
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    try {
      authServerLog("debug", "get_user_profile_starting");
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        authServerLog("info", "get_user_profile_no_user_id", {
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      authServerLog("info", "get_user_profile_fetching", {
        userId: `${userId.slice(0, 8)}...`,
        timestamp: new Date().toISOString(),
      });
      const user = await ctx.db.get(userId);

      // Handle case where user document doesn't exist
      if (!user) {
        authServerLog("error", "get_user_profile_user_doc_not_found", {
          userId: `${userId.slice(0, 8)}...`,
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      const duration = Date.now() - startTime;
      authServerLog("info", "get_user_profile_success", {
        userId: `${userId.slice(0, 8)}...`,
        hasName: !!user.name,
        hasEmail: !!user.email,
        hasImage: !!user.image,
        duration,
        timestamp: new Date().toISOString(),
      });

      return {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null,
        _creationTime: user._creationTime,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authServerLog("error", "get_user_profile_error", {
        error: error?.message,
        type: error?.name,
        duration,
        stack: error?.stack?.slice(0, 200),
        timestamp: new Date().toISOString(),
        context: "getUserProfile",
      });
      // Return null for any errors to prevent auth loops
      return null;
    }
  },
});

// Check if user is authenticated (boolean)
export const isAuthenticatedQuery = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      const isAuth = !!userId;
      authServerLog("info", "is_authenticated_query", {
        isAuthenticated: isAuth,
        userId: userId ? `${userId.slice(0, 8)}...` : null,
        timestamp: new Date().toISOString(),
      });
      return isAuth;
    } catch (error: any) {
      authServerLog("error", "is_authenticated_query_error", {
        error: error?.message,
        type: error?.name,
        stack: error?.stack?.slice(0, 200),
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  },
});

// Get authentication status with user data
export const getAuthStatus = query({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    try {
      authServerLog("info", "get_auth_status_starting");
      const userId = await auth.getUserId(ctx);

      if (!userId) {
        authServerLog("info", "get_auth_status_no_user", {
          timestamp: new Date().toISOString(),
        });
        return {
          isAuthenticated: false,
          user: null,
          error: null,
        };
      }

      authServerLog("info", "get_auth_status_fetching_user", {
        userId: `${userId.slice(0, 8)}...`,
        timestamp: new Date().toISOString(),
      });
      const user = await ctx.db.get(userId);
      if (!user) {
        authServerLog("error", "get_auth_status_user_not_found", {
          userId: `${userId.slice(0, 8)}...`,
          timestamp: new Date().toISOString(),
        });
        return {
          isAuthenticated: false,
          user: null,
          error: "User profile not found",
        };
      }

      const duration = Date.now() - startTime;
      authServerLog("info", "get_auth_status_success", {
        userId: `${userId.slice(0, 8)}...`,
        duration,
        timestamp: new Date().toISOString(),
      });

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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      authServerLog("error", "get_auth_status_error", {
        error: error?.message,
        type: error?.name,
        duration,
        stack: error?.stack?.slice(0, 200),
        timestamp: new Date().toISOString(),
        context: "getAuthStatus",
      });
      return {
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : "Authentication error",
      };
    }
  },
});
