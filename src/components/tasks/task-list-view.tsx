"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CalendarClock, CheckCircle2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/lib/constants";
import { formatDate, initials, isDueToday, isOverdue } from "@/lib/utils";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { Task, Profile } from "@/lib/types";

function daysFromNow(date: string) {
  const diff = (new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000;
  return diff;
}

export function TaskListView({
  tasks,
  members,
  canEditTask,
}: {
  tasks: Task[];
  members: Profile[];
  canEditTask: (task: Task) => boolean;
}) {
  const [selected, setSelected] = useState<Task | null>(null);

  const groups = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    const done = tasks.filter((t) => t.status === "completed" || t.status === "cancelled");

    const overdue = active.filter((t) => isOverdue(t.due_date));
    const today = active.filter((t) => !isOverdue(t.due_date) && isDueToday(t.due_date));
    const thisWeek = active.filter(
      (t) => t.due_date && !isOverdue(t.due_date) && !isDueToday(t.due_date) && daysFromNow(t.due_date) <= 7
    );
    const later = active.filter((t) => t.due_date && daysFromNow(t.due_date) > 7);
    const noDate = active.filter((t) => !t.due_date);

    return { overdue, today, thisWeek, later, noDate, done };
  }, [tasks]);

  const sections: { key: string; label: string; icon: any; items: Task[]; tone?: string }[] = [
    { key: "overdue", label: "Overdue", icon: AlertTriangle, items: groups.overdue, tone: "text-red-600" },
    { key: "today", label: "Due Today", icon: CalendarClock, items: groups.today, tone: "text-orange-600" },
    { key: "thisWeek", label: "This Week", icon: CalendarDays, items: groups.thisWeek, tone: "text-amber-600" },
    { key: "later", label: "Later", icon: CalendarDays, items: groups.later },
    { key: "noDate", label: "No Due Date", icon: Inbox, items: groups.noDate },
    { key: "done", label: "Completed / Cancelled", icon: CheckCircle2, items: groups.done, tone: "text-emerald-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <div key={section.key}>
              <div className="mb-2 flex items-center gap-2">
                <section.icon className={`h-4 w-4 ${section.tone ?? "text-muted-foreground"}`} />
                <h3 className="text-sm font-semibold">{section.label}</h3>
                <span className="text-xs text-muted-foreground">({section.items.length})</span>
              </div>
              <div className="flex flex-col gap-2">
                {section.items.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelected(task)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-soft transition-shadow hover:shadow-soft-lg"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_STYLES[task.priority].dot}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {task.event?.name ?? "Unassigned"}
                          {task.due_date && ` · Due ${formatDate(task.due_date)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={STATUS_STYLES[task.status].badge}>
                        {STATUS_STYLES[task.status].label}
                      </Badge>
                      <div className="hidden -space-x-2 sm:flex">
                        {(task.assignees ?? []).slice(0, 3).map((a) => (
                          <Avatar key={a.id} className="h-6 w-6 border-2 border-card">
                            <AvatarFallback className="text-[9px]">{initials(a.full_name)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
      )}

      {tasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No tasks yet.
        </div>
      )}

      {selected && (
        <TaskDetailDialog
          task={selected}
          members={members}
          canEdit={canEditTask(selected)}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          onUpdated={(t) => setSelected(t)}
          onDeleted={() => setSelected(null)}
        />
      )}
    </div>
  );
}
