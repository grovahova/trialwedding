import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries";
import { TaskBoardShell } from "@/components/tasks/task-board-shell";
import type { Profile, WeddingEvent } from "@/lib/types";

export default async function MyTasksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [allTasks, { data: events }, { data: profiles }] = await Promise.all([
    getTasks(supabase),
    supabase.from("events").select("*").eq("status", "active").order("position"),
    supabase.from("profiles").select("*"),
  ]);

  const currentProfile = (profiles as Profile[] | null)?.find((p) => p.id === user?.id);
  if (!currentProfile) return null;

  const myTasks = allTasks.filter((t) => (t.assignees ?? []).some((a) => a.id === currentProfile.id));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Tasks</h1>
        <p className="text-sm text-muted-foreground">Just the tasks assigned to you, across every event.</p>
      </div>
      <TaskBoardShell
        initialTasks={myTasks}
        events={(events as WeddingEvent[]) ?? []}
        members={(profiles as Profile[]) ?? []}
        currentProfile={currentProfile}
      />
    </div>
  );
}
