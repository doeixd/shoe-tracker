import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Auth debugging utilities for server-side logging
const DEBUG_PREFIX = "[CONVEX_AUTH]";
const isProduction = process.env.NODE_ENV === "production";

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
        error: typeof data?.error === "string" ? data.error : data?.error?.message,
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
  } else if (level === "warn" || level === "error") {
    // Only warn/error in production
    if (level === "warn") {
      console.warn(logMessage + logData);
    } else {
      console.error(logMessage + logData);
    }
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async session({ session, token }) {
      authServerLog("debug", "session_callback", {
        hasSession: !!session,
        hasToken: !!token,
        userId: token?.sub,
      });
      return session;
    },
    async jwt({ token, user, account, profile }) {
      authServerLog("debug", "jwt_callback", {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        hasProfile: !!profile,
        provider: account?.provider,
        userId: token?.sub || user?.id,
      });
      return token;
    },
    async signIn({ user, account, profile }) {
      authServerLog("info", "sign_in_callback", {
        provider: account?.provider,
        userId: user?.id,
        email: user?.email,
        hasProfile: !!profile,
      });
      return true;
    },
  },
  events: {
    async signIn(message) {
      authServerLog("info", "sign_in_event", {
        provider: message.account?.provider,
        userId: message.user?.id,
        email: message.user?.email,
      });
    },
    async signOut(message) {
      authServerLog("info", "sign_out_event", {
        userId: message.token?.sub,
      });
    },
    async createUser(message) {
      authServerLog("info", "create_user_event", {
        userId: message.user?.id,
        email: message.user?.email,
      });
    },
    async linkAccount(message) {
      authServerLog("info", "link_account_event", {
        provider: message.account?.provider,
        userId: message.user?.id,
      });
    },
    async session(message) {
      authServerLog("debug", "session_event", {
        userId: message.session?.userId,
        hasToken: !!message.token,
      });
    },
  },
});

// Setup function to assign seed data to authenticated user
export const setupUserData = mutation({
  handler: async (ctx) => {
    const startTime = Date.now();
    authServerLog("info", "setup_user_data_started");

    try {
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        authServerLog("error", "setup_user_data_not_authenticated");
        throw new Error("Not authenticated");
      }

      authServerLog("debug", "setup_user_data_user_identified", { userId: `${userId.slice(0, 8)}...` });

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

      authServerLog("warn", "force_assign_all_data_user_identified", { userId: `${userId.slice(0, 8)}...` });

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

// Helper to get current user ID, returns null if not authenticated
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await auth.getUserId(ctx);
      authServerLog("debug", "current_user_success", {
        hasUserId: !!userId,
        userId: userId ? `${userId.slice(0, 8)}...` : null
      });
      return userId;
    } catch (error) {
      // Return null for auth errors instead of throwing
      authServerLog("warn", "current_user_auth_error", {
        error: error?.message,
        type: error?.name,
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
      const userId = await auth.getUserId(ctx);
      if (!userId) {
        authServerLog("debug", "get_user_profile_no_user_id");
        return null;
      }

      authServerLog("debug", "get_user_profile_fetching", { userId: `${userId.slice(0, 8)}...` });
      const user = await ctx.db.get(userId);

      // Handle case where user document doesn't exist
      if (!user) {
        authServerLog("warn", "get_user_profile_user_doc_not_found", { userId: `${userId.slice(0, 8)}...` });
        return null;
      }

      const duration = Date.now() - startTime;
      authServerLog("debug", "get_user_profile_success", {
        userId: `${userId.slice(0, 8)}...`,
        hasName: !!user.name,
        hasEmail: !!user.email,
        hasImage: !!user.image,
        duration
      });

      return {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null,
        _creationTime: user._creationTime,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      authServerLog("error", "get_user_profile_error", {
        error: error?.message,
        type: error?.name,
        duration,
        stack: !isProduction ? error?.stack : undefined,
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
      authServerLog("debug", "is_authenticated_query", {
        isAuthenticated: isAuth,
        userId: userId ? `${userId.slice(0, 8)}...` : null
      });
      return isAuth;
    } catch (error) {
      authServerLog("warn", "is_authenticated_query_error", {
        error: error?.message,
        type: error?.name,
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
      const userId = await auth.getUserId(ctx);

      if (!userId) {
        authServerLog("debug", "get_auth_status_no_user");
        return {
          isAuthenticated: false,
          user: null,
          error: null,
        };
      }

      authServerLog("debug", "get_auth_status_fetching_user", { userId: `${userId.slice(0, 8)}...` });
      const user = await ctx.db.get(userId);
      if (!user) {
        authServerLog("warn", "get_auth_status_user_not_found", { userId: `${userId.slice(0, 8)}...` });
        return {
          isAuthenticated: false,
          user: null,
          error: "User profile not found",
        };
      }

      const duration = Date.now() - startTime;
      authServerLog("debug", "get_auth_status_success", {
        userId: `${userId.slice(0, 8)}...`,
        duration
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
    } catch (error) {
      const duration = Date.now() - startTime;
      authServerLog("error", "get_auth_status_error", {
        error: error?.message,
        type: error?.name,
        duration,
        stack: !isProduction ? error?.stack : undefined,
      });
      return {
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error.message : "Authentication error",
      };
    }
  },
});
