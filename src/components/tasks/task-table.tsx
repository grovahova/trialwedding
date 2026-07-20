"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PRIORITY_STYLES, STATUS_STYLES } from "@/lib/constants";
import { cn, formatDate, initials, isOverdue } from "@/lib/utils";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { Task, Profile } from "@/lib/types";

export function TaskTable({
  tasks,
  members,
  canEditTask,
  onUpdated,
  onDeleted,
}: {
  tasks: Task[];
  members: Profile[];
  canEditTask: (task: Task) => boolean;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
}) {
  const [selected, setSelected] = useState<Task | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Assignees</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tasks.map((task) => {
            const overdue = isOverdue(task.due_date) && task.status !== "completed";
            return (
              <tr
                key={task.id}
                onClick={() => setSelected(task)}
                className="cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td className="max-w-xs truncate px-4 py-3 font-medium">{task.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{task.event?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={PRIORITY_STYLES[task.priority].badge} variant="outline">
                    {PRIORITY_STYLES[task.priority].label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_STYLES[task.status].badge} variant="outline">
                    {STATUS_STYLES[task.status].label}
                  </Badge>
                </td>
                <td className={cn("px-4 py-3", overdue ? "font-medium text-red-600" : "text-muted-foreground")}>
                  {task.due_date ? formatDate(task.due_date) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-2">
                    {(task.assignees ?? []).map((a) => (
                      <Avatar key={a.id} className="h-6 w-6 border-2 border-card">
                        <AvatarFallback className="text-[9px]">{initials(a.full_name)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                No tasks match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selected && (
        <TaskDetailDialog
          task={selected}
          members={members}
          canEdit={canEditTask(selected)}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          onUpdated={(t) => {
            onUpdated(t);
            setSelected(t);
          }}
          onDeleted={(id) => {
            onDeleted(id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
