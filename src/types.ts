// Collection types
export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isArchived?: boolean;
}

// Enhanced Shoe types with comprehensive characteristics
export interface Shoe {
  id: string;
  name: string;
  model: string;
  brand?: string;
  collectionId: string;
  imageUrl?: string;
  imageStorageId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  maxMileage: number;
  currentMileage?: number;
  notes?: string;
  isRetired?: boolean;
  retiredDate?: string;
  size?: string;
  weight?: number;
  dropHeight?: number;
  createdAt?: number;

  // Enhanced characteristics
  year?: number;
  msrp?: number;
  colorway?: string;

  // Performance characteristics
  stackHeight?: {
    heel: number;
    forefoot: number;
  };
  cushioningLevel?: CushioningLevel;
  terrainType?: TerrainType[];
  stabilityType?: StabilityType;

  // Materials and construction
  upperMaterial?: UpperMaterial;
  midsoleTechnology?: string[];
  outsoleMaterial?: OutsoleMaterial;

  // Fit characteristics
  widthOptions?: WidthOption[];
  sizingNotes?: string;
  fitCharacteristics?: FitCharacteristic[];

  // Use case and recommendations
  recommendedFor?: RunningType[];
  paceRange?: {
    min: number; // minutes per mile
    max: number;
  };
  distanceRange?: {
    min: number; // miles
    max: number;
  };

  // Durability and maintenance
  expectedMileage?: number;
  durabilityRating?: number; // 1-10 scale
  maintenanceNotes?: string;

  // Sourced from lookup
  isLookedUp?: boolean;
  lookupData?: ShoeLookupData;
}

// Shoe lookup data from external sources
export interface ShoeLookupData {
  source: string;
  lastUpdated: string;
  images: ShoeImage[];
  reviews?: {
    averageRating: number;
    totalReviews: number;
    summary?: string;
  };
  availability?: {
    inStock: boolean;
    retailers: string[];
  };
  variants?: ShoeVariant[];
}

export interface ShoeImage {
  url: string;
  alt: string;
  type: "main" | "side" | "sole" | "detail";
  colorway?: string;
}

export interface ShoeVariant {
  colorway: string;
  images: ShoeImage[];
  availability: boolean;
  price?: number;
}

// Enums for shoe characteristics
export type CushioningLevel = "minimal" | "light" | "moderate" | "maximum";
export type TerrainType = "road" | "trail" | "track" | "treadmill" | "mixed";
export type StabilityType = "neutral" | "stability" | "motion-control";
export type UpperMaterial = "mesh" | "knit" | "synthetic" | "leather" | "mixed";
export type OutsoleMaterial =
  | "rubber"
  | "carbon-rubber"
  | "blown-rubber"
  | "foam";
export type WidthOption = "narrow" | "standard" | "wide" | "extra-wide";
export type FitCharacteristic =
  | "true-to-size"
  | "runs-small"
  | "runs-large"
  | "narrow-toe"
  | "wide-toe"
  | "high-arch"
  | "low-arch";
export type RunningType =
  | "daily-trainer"
  | "tempo"
  | "long-run"
  | "speed-work"
  | "recovery"
  | "racing"
  | "trail"
  | "walking";

// Shoe search and lookup types
export interface ShoeSearchRequest {
  query: string;
  filters?: {
    brand?: string;
    priceRange?: { min: number; max: number };
    terrainType?: TerrainType[];
    cushioningLevel?: CushioningLevel[];
    year?: number;
  };
}

export interface ShoeSearchResult {
  shoes: ShoeLookupResult[];
  total: number;
  query: string;
}

export interface ShoeLookupResult {
  name: string;
  brand: string;
  model: string;
  year?: number;
  msrp?: number;
  weight?: number;
  dropHeight?: number;
  stackHeight?: {
    heel: number;
    forefoot: number;
  };
  cushioningLevel?: CushioningLevel;
  terrainType?: TerrainType[];
  stabilityType?: StabilityType;
  upperMaterial?: UpperMaterial;
  midsoleTechnology?: string[];
  outsoleMaterial?: OutsoleMaterial;
  recommendedFor?: RunningType[];
  expectedMileage?: number;
  images: ShoeImage[];
  variants: ShoeVariant[];
  description?: string;
  keyFeatures?: string[];
  reviews?: {
    averageRating: number;
    totalReviews: number;
    summary?: string;
  };
}

// Run types
export interface Run {
  id: string;
  date: string;
  distance: number;
  duration?: number;
  pace?: string;
  shoeId: string;
  runType: RunType;
  surface?: RunSurface;
  effort?: RunEffort;
  weather?: string;
  temperature?: number;
  notes?: string;
  route?: string;
  elevation?: number;
  heartRate?: number;
  calories?: number;
  createdAt?: number;
}

// Enum-like types
export type RunType =
  | "easy"
  | "tempo"
  | "long"
  | "speed"
  | "recovery"
  | "race"
  | "outdoor"
  | "treadmill"
  | "track"
  | "trail";
export type RunSurface = "road" | "trail" | "track" | "treadmill";
export type RunEffort = "easy" | "moderate" | "hard" | "race";
export type UsageLevel = "new" | "good" | "moderate" | "high" | "replace";

// Extended types for UI
export interface ShoeWithStats extends Shoe {
  stats: {
    totalRuns: number;
    totalDistance: number;
    totalDuration: number;
    avgPace: number | null;
    currentMileage: number;
    usagePercentage: number;
    usageLevel: UsageLevel;
    milesRemaining: number;
  };
  recentRuns: Run[];
}

export interface RunWithShoe extends Run {
  shoe: Shoe | null;
}

// Statistics types
export interface OverallStats {
  totalCollections: number;
  totalShoes: number;
  activeShoes: number;
  retiredShoes: number;
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  avgDistance: number;
  monthlyRuns: number;
  monthlyDistance: number;
  shoesNeedingReplacement: number;
}

// Form types
export interface CreateCollectionForm {
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export interface CreateShoeForm {
  name: string;
  model: string;
  brand?: string;
  collectionId: string;
  maxMileage: number;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
  size?: string;
  weight?: number;
  dropHeight?: number;
}

export interface CreateRunForm {
  date: string;
  distance: string;
  duration: string;
  pace?: string;
  shoeId: string;
  runType: RunType;
  surface?: RunSurface;
  effort?: RunEffort;
  weather?: string;
  temperature?: number;
  humidity?: number;
  notes?: string;
  route?: string;
  location?: string;
  elevation?: number;
  heartRate?: number;
  calories?: number;
}

// UI Constants
export const USAGE_LEVEL_COLORS = {
  new: "bg-blue-100 text-blue-800",
  good: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  replace: "bg-red-100 text-red-800",
} as const;

export const USAGE_LEVEL_LABELS = {
  new: "New",
  good: "Good Condition",
  moderate: "Moderate Wear",
  high: "High Wear",
  replace: "Needs Replacement",
} as const;

export const RUN_TYPE_OPTIONS: { value: RunType; label: string }[] = [
  { value: "easy", label: "Easy Run" },
  { value: "tempo", label: "Tempo" },
  { value: "long", label: "Long Run" },
  { value: "speed", label: "Speed Work" },
  { value: "recovery", label: "Recovery" },
  { value: "race", label: "Race" },
  { value: "outdoor", label: "Outdoor Run" },
  { value: "treadmill", label: "Treadmill" },
  { value: "track", label: "Track" },
  { value: "trail", label: "Trail" },
];

export const RUN_SURFACE_OPTIONS: { value: RunSurface; label: string }[] = [
  { value: "road", label: "Road" },
  { value: "trail", label: "Trail" },
  { value: "track", label: "Track" },
  { value: "treadmill", label: "Treadmill" },
];

export const RUN_EFFORT_OPTIONS: { value: RunEffort; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
  { value: "race", label: "Race" },
];

// Utility functions
export function formatPace(pace: string | undefined): string {
  if (!pace) return "N/A";
  return pace;
}

export function formatDistance(distance: number): string {
  return `${distance.toFixed(2)} mi`;
}

export function formatDuration(minutes: number | undefined): string {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.floor((minutes % 1) * 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getUsageLevel(
  currentMileage: number,
  maxMileage: number,
): UsageLevel {
  const percentage = (currentMileage / maxMileage) * 100;

  if (percentage < 25) return "new";
  if (percentage < 50) return "good";
  if (percentage < 75) return "moderate";
  if (percentage < 90) return "high";
  return "replace";
}

export function calculatePace(distance: number, duration: string): string {
  if (!distance || !duration) return "";

  // Parse duration from HH:MM:SS or MM:SS format
  const timeParts = duration.split(":");
  let totalMinutes = 0;

  if (timeParts.length === 3) {
    // HH:MM:SS format
    totalMinutes =
      parseInt(timeParts[0]) * 60 +
      parseInt(timeParts[1]) +
      parseInt(timeParts[2]) / 60;
  } else if (timeParts.length === 2) {
    // MM:SS format
    totalMinutes = parseInt(timeParts[0]) + parseInt(timeParts[1]) / 60;
  } else {
    return "";
  }

  const paceMinutes = totalMinutes / distance;
  const minutes = Math.floor(paceMinutes);
  const seconds = Math.floor((paceMinutes - minutes) * 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
