"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { PRIORITY_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task, Profile } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TaskCalendarView({
  tasks,
  members,
  canEditTask,
}: {
  tasks: Task[];
  members: Profile[];
  canEditTask: (task: Task) => boolean;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [dayOpen, setDayOpen] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      const key = t.due_date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  function tasksFor(day: Date) {
    return tasksByDay.get(format(day, "yyyy-MM-dd")) ?? [];
  }

  const dayTasks = dayOpen ? tasksFor(dayOpen) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/50 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayItems = tasksFor(day);
            const inMonth = isSameMonth(day, month);
            const visible = dayItems.slice(0, 3);
            const overflow = dayItems.length - visible.length;

            return (
              <button
                key={day.toISOString()}
                onClick={() => dayItems.length > 0 && setDayOpen(day)}
                className={cn(
                  "flex min-h-[92px] flex-col gap-1 border-b border-r border-border p-1.5 text-left align-top transition-colors last:border-r-0",
                  !inMonth && "bg-muted/30 text-muted-foreground/50",
                  dayItems.length > 0 && "hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday(day) && "bg-gradient-to-br from-emerald-600 to-gold-500 text-white"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex flex-col gap-0.5">
                  {visible.map((t) => (
                    <span
                      key={t.id}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white",
                        PRIORITY_STYLES[t.priority].dot
                      )}
                    >
                      {t.name}
                    </span>
                  ))}
                  {overflow > 0 && <span className="text-[10px] text-muted-foreground">+{overflow} more</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Dialog open={!!dayOpen} onOpenChange={(open) => !open && setDayOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dayOpen && format(dayOpen, "EEEE, d MMMM yyyy")}</DialogTitle>
            <DialogDescription>{dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""} due</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {dayTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTask(t);
                  setDayOpen(null);
                }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_STYLES[t.priority].dot)} />
                {t.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          members={members}
          canEdit={canEditTask(selectedTask)}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdated={(t) => setSelectedTask(t)}
          onDeleted={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
