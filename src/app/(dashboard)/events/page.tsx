import { createClient } from "@/lib/supabase/server";
import { EventsGrid } from "@/components/events/events-grid";
import type { Profile, WeddingEvent } from "@/lib/types";

export default async function EventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: archivedEvents }, { data: tasks }, { data: profile }] = await Promise.all([
    supabase.from("events").select("*").eq("status", "active").order("position"),
    supabase.from("events").select("*").eq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("tasks").select("id, event_id, status"),
    supabase.from("profiles").select("*").eq("id", user?.id).single(),
  ]);

  const taskCounts: Record<string, { total: number; completed: number }> = {};
  for (const t of tasks ?? []) {
    if (!t.event_id) continue;
    taskCounts[t.event_id] ??= { total: 0, completed: 0 };
    taskCounts[t.event_id].total += 1;
    if (t.status === "completed") taskCounts[t.event_id].completed += 1;
  }

  return (
    <EventsGrid
      events={(events as WeddingEvent[]) ?? []}
      archivedEvents={(archivedEvents as WeddingEvent[]) ?? []}
      taskCounts={taskCounts}
      isAdmin={(profile as Profile | null)?.role === "admin"}
    />
  );
}
