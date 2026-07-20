import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "@/lib/types";

const TASK_SELECT = `*,
  event:events(id, name, color_theme),
  assignees:task_assignees(profile:profiles(*)),
  checklist:task_checklist_items(*),
  comments:task_comments(*, profile:profiles(id, full_name, avatar_url))`;

export async function getTasks(supabase: SupabaseClient, opts: { eventId?: string } = {}) {
  let query = supabase.from("tasks").select(TASK_SELECT).order("created_at", { ascending: false });
  if (opts.eventId) query = query.eq("event_id", opts.eventId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(normalizeTask);
}

export function normalizeTask(raw: any): Task {
  return {
    ...raw,
    assignees: (raw.assignees ?? []).map((a: any) => a.profile).filter(Boolean),
    checklist: raw.checklist ?? [],
    comments: raw.comments ?? [],
  };
}
