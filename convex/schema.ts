import { defineSchema, defineTable } from "convex/server";
import { type Infer, v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  // Collections of shoes (like "Road Running", "Trail Running", "Racing", etc.)
  collections: defineTable({
    id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    userId: v.optional(v.id("users")), // Link to authenticated user
  })
    .index("id", ["id"])
    .index("userId", ["userId"]),

  // Individual shoes
  shoes: defineTable({
    id: v.string(),
    name: v.string(),
    model: v.string(),
    brand: v.optional(v.string()),
    collectionId: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    purchaseDate: v.optional(v.string()),
    purchasePrice: v.optional(v.number()),
    maxMileage: v.number(), // Miles until shoe should be retired
    currentMileage: v.optional(v.number()), // Current miles on the shoe
    notes: v.optional(v.string()),
    isRetired: v.optional(v.boolean()),
    retiredDate: v.optional(v.string()),
    size: v.optional(v.string()),
    weight: v.optional(v.number()), // Weight in grams or ounces
    dropHeight: v.optional(v.number()), // Heel-to-toe drop in mm
    createdAt: v.optional(v.number()),
    userId: v.optional(v.id("users")), // Link to authenticated user
  })
    .index("id", ["id"])
    .index("collection", ["collectionId"])
    .index("isRetired", ["isRetired"])
    .index("userId", ["userId"]),

  // Individual runs
  runs: defineTable({
    id: v.string(),
    date: v.string(), // ISO date string
    distance: v.number(), // Distance in miles or km
    duration: v.optional(v.number()), // Duration in minutes
    pace: v.optional(v.string()), // Pace as string (e.g., "7:30")
    shoeId: v.string(), // Which shoe was worn
    runType: v.string(), // "outdoor", "treadmill", "track", "trail"
    surface: v.optional(v.string()), // "road", "trail", "track", "treadmill"
    effort: v.optional(v.string()), // "easy", "moderate", "hard", "race"
    weather: v.optional(v.string()),
    temperature: v.optional(v.number()),
    notes: v.optional(v.string()),
    route: v.optional(v.string()),
    elevation: v.optional(v.number()), // Elevation gain/loss
    heartRate: v.optional(v.number()), // Average heart rate
    calories: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    userId: v.optional(v.id("users")), // Link to authenticated user
  })
    .index("id", ["id"])
    .index("shoe", ["shoeId"])
    .index("date", ["date"])
    .index("userId", ["userId"]),
});

export default schema;

const collection = schema.tables.collections.validator;
const shoe = schema.tables.shoes.validator;
const run = schema.tables.runs.validator;

// Collection schemas
export const createCollectionSchema = v.object({
  name: collection.fields.name,
  description: v.optional(collection.fields.description),
  color: collection.fields.color,
  icon: v.optional(collection.fields.icon),
});

export const updateCollectionSchema = v.object({
  id: collection.fields.id,
  name: v.optional(collection.fields.name),
  description: v.optional(collection.fields.description),
  color: v.optional(collection.fields.color),
  icon: v.optional(collection.fields.icon),
  isArchived: v.optional(collection.fields.isArchived),
});

export const deleteCollectionSchema = v.object({
  id: collection.fields.id,
});

// Shoe schemas
export const createShoeSchema = v.object({
  name: shoe.fields.name,
  model: shoe.fields.model,
  brand: v.optional(shoe.fields.brand),
  collectionId: shoe.fields.collectionId,
  maxMileage: shoe.fields.maxMileage,
  purchaseDate: v.optional(shoe.fields.purchaseDate),
  purchasePrice: v.optional(shoe.fields.purchasePrice),
  notes: v.optional(shoe.fields.notes),
  size: v.optional(shoe.fields.size),
  weight: v.optional(shoe.fields.weight),
  dropHeight: v.optional(shoe.fields.dropHeight),
});

export const updateShoeSchema = v.object({
  id: shoe.fields.id,
  name: v.optional(shoe.fields.name),
  model: v.optional(shoe.fields.model),
  brand: v.optional(shoe.fields.brand),
  collectionId: v.optional(shoe.fields.collectionId),
  maxMileage: v.optional(shoe.fields.maxMileage),
  currentMileage: v.optional(shoe.fields.currentMileage),
  purchaseDate: v.optional(shoe.fields.purchaseDate),
  purchasePrice: v.optional(shoe.fields.purchasePrice),
  notes: v.optional(shoe.fields.notes),
  isRetired: v.optional(shoe.fields.isRetired),
  retiredDate: v.optional(shoe.fields.retiredDate),
  size: v.optional(shoe.fields.size),
  weight: v.optional(shoe.fields.weight),
  dropHeight: v.optional(shoe.fields.dropHeight),
  imageUrl: v.optional(shoe.fields.imageUrl),
  imageStorageId: v.optional(shoe.fields.imageStorageId),
});

export const deleteShoeSchema = v.object({
  id: shoe.fields.id,
});

// Run schemas
export const createRunSchema = v.object({
  date: run.fields.date,
  distance: run.fields.distance,
  duration: v.optional(run.fields.duration),
  pace: v.optional(run.fields.pace),
  shoeId: run.fields.shoeId,
  runType: run.fields.runType,
  surface: v.optional(run.fields.surface),
  effort: v.optional(run.fields.effort),
  weather: v.optional(run.fields.weather),
  temperature: v.optional(run.fields.temperature),
  notes: v.optional(run.fields.notes),
  route: v.optional(run.fields.route),
  elevation: v.optional(run.fields.elevation),
  heartRate: v.optional(run.fields.heartRate),
  calories: v.optional(run.fields.calories),
});

export const updateRunSchema = v.object({
  id: run.fields.id,
  date: v.optional(run.fields.date),
  distance: v.optional(run.fields.distance),
  duration: v.optional(run.fields.duration),
  pace: v.optional(run.fields.pace),
  shoeId: v.optional(run.fields.shoeId),
  runType: v.optional(run.fields.runType),
  surface: v.optional(run.fields.surface),
  effort: v.optional(run.fields.effort),
  weather: v.optional(run.fields.weather),
  temperature: v.optional(run.fields.temperature),
  notes: v.optional(run.fields.notes),
  route: v.optional(run.fields.route),
  elevation: v.optional(run.fields.elevation),
  heartRate: v.optional(run.fields.heartRate),
  calories: v.optional(run.fields.calories),
});

export const deleteRunSchema = v.object({
  id: run.fields.id,
});

// Type exports
export type Collection = Infer<typeof collection>;
export type Shoe = Infer<typeof shoe>;
export type Run = Infer<typeof run>;
