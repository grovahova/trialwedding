import type { TaskPriority, TaskStatus } from "@/lib/types";

export const EVENT_GRADIENTS: Record<string, string> = {
  "mehendi-gradient": "bg-mehendi-gradient",
  "haldi-gradient": "bg-haldi-gradient",
  "nikah-gradient": "bg-nikah-gradient",
  "reception-gradient": "bg-reception-gradient",
};

export const EVENT_GRADIENT_OPTIONS = [
  { value: "mehendi-gradient", label: "Henna Green (Mehendi)" },
  { value: "haldi-gradient", label: "Marigold Yellow (Haldi)" },
  { value: "nikah-gradient", label: "Emerald & Gold (Nikah)" },
  { value: "reception-gradient", label: "Champagne (Reception)" },
];

export const PRIORITY_STYLES: Record<TaskPriority, { label: string; dot: string; badge: string }> = {
  critical: { label: "Critical", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  high: { label: "High", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  medium: { label: "Medium", dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "Low", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const STATUS_STYLES: Record<TaskStatus, { label: string; badge: string }> = {
  not_started: { label: "Not Started", badge: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "In Progress", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  waiting: { label: "Waiting", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  blocked: { label: "Blocked", badge: "bg-red-50 text-red-700 border-red-200" },
  completed: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", badge: "bg-gray-100 text-gray-500 border-gray-200 line-through" },
};

export const KANBAN_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "waiting", label: "Waiting" },
  { status: "blocked", label: "Blocked" },
  { status: "completed", label: "Completed" },
];

export const SHOPPING_CATEGORIES = [
  "Clothes",
  "Jewelry",
  "Decorations",
  "Flowers",
  "Food",
  "Return Gifts",
  "Wedding Cards",
  "Stage",
  "Lighting",
  "Other",
];

export const VENDOR_CATEGORIES = [
  "Photographer",
  "Decorator",
  "Catering",
  "Makeup Artist",
  "Mehendi Artist",
  "DJ",
  "Venue",
  "Flowers",
  "Jeweler",
  "Other",
];
