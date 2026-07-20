// Hand-written types mirroring supabase/migrations/0001_init.sql and 0002_vendor_bookings.sql.
// See the note at the bottom of this file re: why there's no generic `Database` type.

export type UserRole = "admin" | "family" | "volunteer";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "completed"
  | "cancelled";
export type EventStatus = "active" | "archived";
export type ShoppingStatus = "pending" | "ordered" | "purchased";
export type PaymentStatus = "unpaid" | "advance_paid" | "paid";
export type RsvpStatus = "pending" | "confirmed" | "declined" | "no_response";
export type GuestSide = "bride" | "groom" | "both";
export type GuestGroup = "family" | "friends" | "vip" | "colleague" | "other";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface WeddingSettings {
  id: number;
  couple_names: string;
  wedding_date: string;
  planning_start_date: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  color_theme: string;
  description: string | null;
  status: EventStatus;
  position: number;
  created_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completion_percent: number;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  assignees?: Profile[];
  checklist?: TaskChecklistItem[];
  comments?: TaskComment[];
  event?: Pick<WeddingEvent, "id" | "name" | "color_theme">;
}

export interface TaskChecklistItem {
  id: string;
  task_id: string;
  label: string;
  is_done: boolean;
  position: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  profile_id: string | null;
  body: string;
  created_at: string;
  profile?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface ShoppingItem {
  id: string;
  event_id: string | null;
  category: string;
  name: string;
  quantity: number;
  budget_amount: number;
  actual_amount: number | null;
  store: string | null;
  status: ShoppingStatus;
  assigned_to: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  event_id: string | null;
  category: string;
  item_name: string;
  planned_amount: number;
  actual_amount: number;
  vendor_id: string | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  event_id: string | null;
  advance_paid: number;
  total_amount: number;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  side: GuestSide;
  guest_group: GuestGroup;
  rsvp_status: RsvpStatus;
  invitation_sent: boolean;
  food_preference: string | null;
  phone: string | null;
  plus_ones: number;
  notes: string | null;
  created_at: string;
}

export type BookingStatus = "not_booked" | "enquired" | "negotiating" | "booked" | "confirmed" | "cancelled";

export interface VendorBooking {
  id: string;
  category: string;
  vendor_name: string | null;
  event_id: string | null;
  status: BookingStatus;
  booking_date: string | null;
  contract_signed: boolean;
  advance_paid: number;
  total_amount: number;
  final_payment_due_date: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  trial_scheduled_date: string | null;
  fitting_dates: string[];
  notes: string | null;
  contract_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  event?: Pick<WeddingEvent, "id" | "name" | "color_theme">;
}

export interface AppNotification {
  id: string;
  profile_id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "avatar_url">;
}

// Note: there is deliberately no generic `Database` type passed to the
// Supabase clients (see supabase/client.ts and supabase/server.ts). Every
// query result in this codebase is already manually cast to the interfaces
// above (e.g. `data as Task[]`), so a generic never provided real
// column-level safety here — and a hand-written minimal one caused
// TypeScript to infer `never` on some `.eq().single()` chains, breaking
// production builds. If you want real generated types later, run:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
// and pass that as the generic to createBrowserClient/createServerClient.
