import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EVENT_GRADIENTS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { WeddingEvent } from "@/lib/types";

export function EventStatusWidget({
  events,
}: {
  events: (WeddingEvent & { taskCount: number; completedCount: number })[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {events.map((event) => {
          const pct = event.taskCount === 0 ? 0 : Math.round((event.completedCount / event.taskCount) * 100);
          return (
            <Link
              href={`/events/${event.id}`}
              key={event.id}
              className="block rounded-lg border border-border p-3 transition-colors hover:border-gold-300"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_GRADIENTS[event.color_theme])} />
                  {event.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {event.event_date ? formatDate(event.event_date) : "No date"}
                </span>
              </div>
              <Progress value={pct} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {event.completedCount}/{event.taskCount} tasks · {pct}% complete
              </p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
