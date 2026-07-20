"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Rows3, Plus, Search, Table2, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import type { Task, Profile, WeddingEvent } from "@/lib/types";

export function TaskBoardShell({
  initialTasks,
  events,
  members,
  currentProfile,
  defaultEventId,
  hideEventFilter,
}: {
  initialTasks: Task[];
  events: WeddingEvent[];
  members: Profile[];
  currentProfile: Profile;
  defaultEventId?: string;
  hideEventFilter?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const [view, setView] = useState<"kanban" | "table" | "list" | "calendar">("kanban");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string>(defaultEventId ?? "all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = currentProfile.role === "admin";

  function canEditTask(task: Task) {
    return isAdmin || (task.assignees ?? []).some((a) => a.id === currentProfile.id);
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (eventFilter !== "all" && t.event_id !== eventFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, eventFilter, priorityFilter, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {!hideEventFilter && (
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Event" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5">
            <Button
              size="icon"
              variant={view === "kanban" ? "default" : "ghost"}
              className="h-8 w-8"
              onClick={() => setView("kanban")}
              aria-label="Kanban view"
              title="Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "table" ? "default" : "ghost"}
              className="h-8 w-8"
              onClick={() => setView("table")}
              aria-label="Table view"
              title="Table"
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "list" ? "default" : "ghost"}
              className="h-8 w-8"
              onClick={() => setView("list")}
              aria-label="List view"
              title="List"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={view === "calendar" ? "default" : "ghost"}
              className="h-8 w-8"
              onClick={() => setView("calendar")}
              aria-label="Calendar view"
              title="Calendar"
            >
              <CalendarRange className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="gold" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </div>

      {view === "kanban" && <KanbanBoard tasks={filtered} members={members} canEditTask={canEditTask} />}
      {view === "table" && (
        <TaskTable
          tasks={filtered}
          members={members}
          canEditTask={canEditTask}
          onUpdated={(t) => setTasks((prev) => prev.map((p) => (p.id === t.id ? t : p)))}
          onDeleted={(id) => setTasks((prev) => prev.filter((p) => p.id !== id))}
        />
      )}
      {view === "list" && <TaskListView tasks={filtered} members={members} canEditTask={canEditTask} />}
      {view === "calendar" && <TaskCalendarView tasks={filtered} members={members} canEditTask={canEditTask} />}

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        events={events}
        members={members}
        defaultEventId={defaultEventId}
      />
    </div>
  );
}
