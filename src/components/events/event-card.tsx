"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Archive, ArrowRight, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { EVENT_GRADIENTS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { WeddingEvent } from "@/lib/types";

export function EventCard({
  event,
  taskCount,
  completedCount,
  isAdmin,
  onArchive,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  event: WeddingEvent;
  taskCount: number;
  completedCount: number;
  isAdmin: boolean;
  onArchive?: () => void;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const pct = taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <Link
        href={`/events/${event.id}`}
        className={cn(
          "block overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all gold-hover"
        )}
      >
        <div className={cn("h-24 w-full", EVENT_GRADIENTS[event.color_theme])} />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">{event.name}</h3>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <p className="text-xs text-muted-foreground">
            {event.event_date ? formatDate(event.event_date, "EEEE, d MMMM yyyy") : "No date set"}
          </p>
          {event.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>}
          <div className="mt-3">
            <Progress value={pct} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {completedCount}/{taskCount} tasks · {pct}%
            </p>
          </div>
        </div>
      </Link>

      {isAdmin && (
        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onMoveUp && (
            <button
              onClick={(e) => { e.preventDefault(); onMoveUp(); }}
              disabled={isFirst}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-opacity hover:bg-white/30 disabled:pointer-events-none disabled:opacity-40"
              title="Move earlier"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => { e.preventDefault(); onMoveDown(); }}
              disabled={isLast}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-opacity hover:bg-white/30 disabled:pointer-events-none disabled:opacity-40"
              title="Move later"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.preventDefault(); onEdit(); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-opacity hover:bg-white/30"
              title="Edit event"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onArchive && (
            <button
              onClick={(e) => { e.preventDefault(); onArchive(); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-opacity hover:bg-white/30"
              title="Archive event"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
