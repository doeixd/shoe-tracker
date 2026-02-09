import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Flag,
  FolderOpen,
  Footprints,
  Gauge,
  Mountain,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";

export type CollectionIconKey =
  | "folder"
  | "footprints"
  | "mountain"
  | "zap"
  | "timer"
  | "target"
  | "trophy"
  | "gauge"
  | "activity"
  | "flag";

export const DEFAULT_COLLECTION_ICON: CollectionIconKey = "folder";

const COLLECTION_ICON_MAP: Record<CollectionIconKey, LucideIcon> = {
  folder: FolderOpen,
  footprints: Footprints,
  mountain: Mountain,
  zap: Zap,
  timer: Timer,
  target: Target,
  trophy: Trophy,
  gauge: Gauge,
  activity: Activity,
  flag: Flag,
};

export const COLLECTION_ICON_OPTIONS: Array<{
  key: CollectionIconKey;
  label: string;
}> = [
  { key: "folder", label: "Folder" },
  { key: "footprints", label: "Footprints" },
  { key: "mountain", label: "Mountain" },
  { key: "zap", label: "Speed" },
  { key: "timer", label: "Training" },
  { key: "target", label: "Goal" },
  { key: "trophy", label: "Race" },
  { key: "gauge", label: "Performance" },
  { key: "activity", label: "Activity" },
  { key: "flag", label: "Finish" },
];

export function getCollectionIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return COLLECTION_ICON_MAP[DEFAULT_COLLECTION_ICON];
  return (
    COLLECTION_ICON_MAP[iconKey as CollectionIconKey] ||
    COLLECTION_ICON_MAP[DEFAULT_COLLECTION_ICON]
  );
}
