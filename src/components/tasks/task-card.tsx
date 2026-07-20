"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, MessageCircle, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PRIORITY_STYLES } from "@/lib/constants";
import { cn, formatDate, initials, isOverdue } from "@/lib/utils";
import type { Task } from "@/lib/types";

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isOverdue(task.due_date) && task.status !== "completed" && task.status !== "cancelled";
  const checklistDone = task.checklist?.filter((c) => c.is_done).length ?? 0;
  const checklistTotal = task.checklist?.length ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab space-y-2.5 rounded-lg border border-border bg-card p-3 shadow-soft transition-shadow hover:shadow-soft-lg active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.name}</p>
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", PRIORITY_STYLES[task.priority].dot)} />
      </div>

      {task.event && (
        <Badge variant="outline" className="text-[10px]">
          {task.event.name}
        </Badge>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <span className={cn("flex items-center gap-1", overdue && "font-medium text-red-600")}>
              <CalendarDays className="h-3 w-3" /> {formatDate(task.due_date, "d MMM")}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" /> {checklistDone}/{checklistTotal}
            </span>
          )}
          {(task.comments?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> {task.comments!.length}
            </span>
          )}
        </div>
        <div className="flex -space-x-2">
          {(task.assignees ?? []).slice(0, 3).map((a) => (
            <Avatar key={a.id} className="h-5 w-5 border-2 border-card">
              <AvatarFallback className="text-[9px]">{initials(a.full_name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
