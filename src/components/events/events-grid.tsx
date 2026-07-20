"use client";

import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EditEventDialog } from "@/components/events/edit-event-dialog";
import { EVENT_GRADIENTS } from "@/lib/constants";
import { cn, getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import type { WeddingEvent } from "@/lib/types";

export function EventsGrid({
  events,
  archivedEvents,
  taskCounts,
  isAdmin,
}: {
  events: WeddingEvent[];
  archivedEvents: WeddingEvent[];
  taskCounts: Record<string, { total: number; completed: number }>;
  isAdmin: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);

  async function archiveEvent(id: string) {
    if (!confirm("Archive this event? It will be hidden from the sidebar but data is kept — you can restore it any time.")) return;
    const { error } = await supabase.from("events").update({ status: "archived" }).eq("id", id);
    if (error) return toast.error(getErrorMessage(error));
    toast.success("Event archived");
    router.refresh();
  }

  async function restoreEvent(id: string) {
    const { error } = await supabase.from("events").update({ status: "active" }).eq("id", id);
    if (error) return toast.error(getErrorMessage(error));
    toast.success("Event restored");
    router.refresh();
  }

  async function deleteEvent(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This removes ALL its tasks, shopping items, and budget lines. This cannot be undone.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(getErrorMessage(error));
    toast.success("Event deleted permanently");
    router.refresh();
  }

  // Renumbers every active event 1..N based on the new visual order — this
  // self-heals any messy/duplicate position values from manually-created
  // events, not just the two being swapped.
  async function moveEvent(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= events.length) return;

    const reordered = [...events];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    const results = await Promise.all(
      reordered.map((ev, i) => supabase.from("events").update({ position: i + 1 }).eq("id", ev.id))
    );
    if (results.some((r) => r.error)) {
      toast.error("Could not reorder events");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">Every ceremony, at a glance. Hover a card to edit, reorder, or archive it.</p>
        </div>
        {isAdmin && (
          <Button variant="gold" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            taskCount={taskCounts[event.id]?.total ?? 0}
            completedCount={taskCounts[event.id]?.completed ?? 0}
            isAdmin={isAdmin}
            onArchive={() => archiveEvent(event.id)}
            onEdit={() => setEditingEvent(event)}
            onMoveUp={() => moveEvent(index, -1)}
            onMoveDown={() => moveEvent(index, 1)}
            isFirst={index === 0}
            isLast={index === events.length - 1}
          />
        ))}
        {events.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No events yet. {isAdmin && "Create your first one above."}
          </div>
        )}
      </div>

      {isAdmin && archivedEvents.length > 0 && (
        <div>
          <h2 className="mb-2 mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Archived Events
          </h2>
          <div className="flex flex-col gap-2">
            {archivedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_GRADIENTS[event.color_theme])} />
                  <span className="text-sm font-medium text-muted-foreground">{event.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => restoreEvent(event.id)}>
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteEvent(event.id, event.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateEventDialog open={open} onOpenChange={setOpen} nextPosition={events.length + 1} />
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
        />
      )}
    </div>
  );
}
