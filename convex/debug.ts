import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Simple test mutation to verify basic functionality
export const testInsert = mutation({
  args: {
    message: v.string(),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("=== DEBUG TEST INSERT ===");
    console.log("Args received:", args);

    try {
      // Check authentication
      const userId = await auth.getUserId(ctx);
      console.log("User ID:", userId);

      if (!userId) {
        console.log("ERROR: User not authenticated");
        throw new Error("Not authenticated");
      }

      // Insert a simple test document
      const testDoc = {
        message: args.message,
        timestamp: args.timestamp || Date.now(),
        userId: userId,
        testId: crypto.randomUUID(),
      };

      console.log("Inserting document:", testDoc);

      // Create a test table entry
      const docId = await ctx.db.insert("collections", {
        id: testDoc.testId,
        name: `DEBUG: ${testDoc.message}`,
        description: `Test collection created at ${new Date().toISOString()}`,
        color: "#ff0000",
        isArchived: false,
        userId: userId,
      });

      console.log("Document inserted with ID:", docId);

      // Verify the insert by reading it back
      const insertedDoc = await ctx.db.get(docId);
      console.log("Document verification:", insertedDoc);

      return {
        success: true,
        docId: docId,
        testId: testDoc.testId,
        userId: userId,
        insertedDoc: insertedDoc,
      };
    } catch (error) {
      console.error("ERROR in testInsert:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      throw error;
    }
  },
});

// Query to get all test documents
export const getTestDocuments = query({
  args: {},
  handler: async (ctx) => {
    console.log("=== DEBUG GET TEST DOCUMENTS ===");

    try {
      const userId = await auth.getUserId(ctx);
      console.log("User ID for query:", userId);

      if (!userId) {
        console.log("No user authenticated for query");
        return [];
      }

      // Get all collections for this user
      const collections = await ctx.db
        .query("collections")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      console.log("Found collections:", collections.length);
      console.log("Collections data:", collections);

      return collections;
    } catch (error) {
      console.error("ERROR in getTestDocuments:", error);
      return [];
    }
  },
});

// Test mutation that doesn't require auth (for basic connectivity test)
export const testBasicInsert = mutation({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("=== BASIC TEST INSERT (NO AUTH) ===");
    console.log("Args:", args);

    try {
      const testDoc = {
        id: crypto.randomUUID(),
        name: `BASIC_TEST: ${args.message}`,
        description: `Basic test at ${new Date().toISOString()}`,
        color: "#00ff00",
        isArchived: false,
        // No userId - this will be unassigned data
      };

      console.log("Inserting basic test document:", testDoc);

      const docId = await ctx.db.insert("collections", testDoc);

      console.log("Basic test document inserted with ID:", docId);

      return {
        success: true,
        docId: docId,
        testId: testDoc.id,
      };
    } catch (error) {
      console.error("ERROR in testBasicInsert:", error);
      throw error;
    }
  },
});

// Query to get all documents (including unassigned)
export const getAllTestDocuments = query({
  args: {},
  handler: async (ctx) => {
    console.log("=== GET ALL TEST DOCUMENTS ===");

    try {
      const allCollections = await ctx.db.query("collections").collect();

      console.log("Total collections in database:", allCollections.length);

      // Separate by user assignment
      const assigned = allCollections.filter((doc) => doc.userId);
      const unassigned = allCollections.filter((doc) => !doc.userId);

      console.log("Assigned collections:", assigned.length);
      console.log("Unassigned collections:", unassigned.length);

      return {
        total: allCollections.length,
        assigned: assigned,
        unassigned: unassigned,
        all: allCollections,
      };
    } catch (error) {
      console.error("ERROR in getAllTestDocuments:", error);
      return {
        total: 0,
        assigned: [],
        unassigned: [],
        all: [],
      };
    }
  },
});

// Clear all test data
export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("=== CLEARING TEST DATA ===");

    try {
      const userId = await auth.getUserId(ctx);
      console.log("User ID for cleanup:", userId);

      if (!userId) {
        throw new Error("Not authenticated");
      }

      // Get all collections that start with DEBUG or BASIC_TEST
      const allCollections = await ctx.db.query("collections").collect();
      const testCollections = allCollections.filter(
        (col) =>
          col.name?.startsWith("DEBUG:") || col.name?.startsWith("BASIC_TEST:"),
      );

      console.log("Found test collections to delete:", testCollections.length);

      for (const collection of testCollections) {
        console.log("Deleting collection:", collection.name);
        await ctx.db.delete(collection._id);
      }

      return {
        success: true,
        deletedCount: testCollections.length,
      };
    } catch (error) {
      console.error("ERROR in clearTestData:", error);
      throw error;
    }
  },
});

// Test connection and auth status
export const testConnection = query({
  args: {},
  handler: async (ctx) => {
    console.log("=== CONNECTION TEST ===");

    const now = Date.now();
    console.log("Current timestamp:", now);

    try {
      const userId = await auth.getUserId(ctx);
      console.log("Auth test - User ID:", userId);

      return {
        success: true,
        timestamp: now,
        userId: userId,
        isAuthenticated: !!userId,
        serverTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error("ERROR in testConnection:", error);
      return {
        success: false,
        timestamp: now,
        userId: null,
        isAuthenticated: false,
        serverTime: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
