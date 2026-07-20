"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { KANBAN_COLUMNS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus, Profile } from "@/lib/types";
import { toast } from "sonner";

function Column({ status, label, children }: { status: TaskStatus; label: string; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors",
        isOver && "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto scrollbar-thin">{children}</div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  members,
  canEditTask,
}: {
  tasks: Task[];
  members: Profile[];
  canEditTask: (task: Task) => boolean;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(tasks);

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      not_started: [],
      in_progress: [],
      waiting: [],
      blocked: [],
      completed: [],
      cancelled: [],
    };
    for (const t of items) map[t.status].push(t);
    return map;
  }, [items]);

  function handleDragStart(event: DragStartEvent) {
    const task = items.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const task = items.find((t) => t.id === active.id);
    if (!task) return;

    const newStatus = KANBAN_COLUMNS.some((c) => c.status === over.id)
      ? (over.id as TaskStatus)
      : items.find((t) => t.id === over.id)?.status;

    if (!newStatus || newStatus === task.status) return;
    if (!canEditTask(task)) {
      toast.error("You can only move tasks assigned to you");
      return;
    }

    setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));

    const completionPercent = newStatus === "completed" ? 100 : task.completion_percent;
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completion_percent: completionPercent })
      .eq("id", task.id);

    if (error) {
      toast.error("Could not update task");
      setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
      return;
    }

    if (newStatus === "completed") {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ["#187d5c", "#dba93a", "#f5ebc9"] });
      toast.success(`"${task.name}" completed 🎉`);
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {KANBAN_COLUMNS.map((col) => (
            <Column key={col.status} status={col.status} label={col.label} count={grouped[col.status].length}>
              <SortableContext items={grouped[col.status].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {grouped[col.status].map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
                {grouped[col.status].length === 0 && (
                  <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </SortableContext>
            </Column>
          ))}
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} onClick={() => {}} />}</DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          members={members}
          canEdit={canEditTask(selectedTask)}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdated={(updated) => {
            setItems((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelectedTask(updated);
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((t) => t.id !== id));
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}
