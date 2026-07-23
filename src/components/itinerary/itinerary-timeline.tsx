"use client";

import { useMemo, useState } from "react";
import { Plus, MapPin, Users, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItineraryItemDialog } from "@/components/itinerary/itinerary-item-dialog";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ItineraryItem, WeddingEvent, Profile } from "@/lib/types";

const TRACK_META = {
  guests: { label: "Guests", icon: Users, dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  bride_groom: { label: "Bride & Groom", icon: Heart, dot: "bg-gold-500", badge: "bg-gold-50 text-gold-700 border-gold-200" },
  general: { label: "General", icon: Clock, dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export function ItineraryTimeline({
  items,
  events,
  isAdmin,
}: {
  items: ItineraryItem[];
  events: WeddingEvent[];
  isAdmin: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<ItineraryItem | null>(null);
  const [pendingDate, setPendingDate] = useState<string | undefined>(undefined);

  const byDate = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();
    for (const item of items) {
      const key = item.item_date ?? "unscheduled";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "unscheduled") return 1;
      if (b === "unscheduled") return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [items]);

  function openNew(defaultDate?: string) {
    setSelected(null);
    setDialogOpen(true);
    setPendingDate(defaultDate);
  }

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Button variant="gold" onClick={() => openNew()}>
            <Plus className="h-4 w-4" /> Add Itinerary Item
          </Button>
        </div>
      )}

      {byDate.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No itinerary items yet. {isAdmin && "Add your first one above."}
        </div>
      )}

      {byDate.map(([date, dayItems]) => (
        <div key={date}>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold">
              {date === "unscheduled" ? "Unscheduled" : formatDate(date, "EEEE, d MMMM yyyy")}
            </h2>
            {date !== "unscheduled" && isAdmin && (
              <Button size="sm" variant="outline" className="h-7" onClick={() => openNew(date)}>
                <Plus className="h-3 w-3" /> Add to this day
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2 border-l-2 border-border pl-4">
            {dayItems.map((item) => {
              const meta = TRACK_META[item.track];
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelected(item);
                    setDialogOpen(true);
                  }}
                  className="-ml-[21px] flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-soft transition-shadow hover:shadow-soft-lg"
                >
                  <span className={cn("mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-card", meta.dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {(item.start_time || item.end_time) && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {item.start_time}
                          {item.end_time && ` – ${item.end_time}`}
                        </span>
                      )}
                      <Badge variant="outline" className={cn("text-[10px]", meta.badge)}>{meta.label}</Badge>
                      {item.event && <Badge variant="outline" className="text-[10px]">{item.event.name}</Badge>}
                    </div>
                    <p className="mt-1 text-sm font-medium">{item.title}</p>
                    {item.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {item.location}
                      </p>
                    )}
                    {item.responsible_party && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Owner: {item.responsible_party}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <ItineraryItemDialog
        item={selected}
        events={events}
        defaultDate={pendingDate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
