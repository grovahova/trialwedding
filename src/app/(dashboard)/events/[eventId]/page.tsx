import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/queries";
import { EventDetailTabs } from "@/components/events/event-detail-tabs";
import { Progress } from "@/components/ui/progress";
import { EVENT_GRADIENTS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { Profile, WeddingEvent, ShoppingItem, BudgetItem, Vendor } from "@/lib/types";

export default async function EventDetailPage({ params }: { params: { eventId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase.from("events").select("*").eq("id", params.eventId).single();
  if (!event) notFound();

  const [tasks, { data: shopping }, { data: budget }, { data: vendors }, { data: allEvents }, { data: profiles }] =
    await Promise.all([
      getTasks(supabase, { eventId: params.eventId }),
      supabase.from("shopping_items").select("*").eq("event_id", params.eventId),
      supabase.from("budget_items").select("*").eq("event_id", params.eventId),
      supabase.from("vendors").select("*"),
      supabase.from("events").select("*").eq("status", "active").order("position"),
      supabase.from("profiles").select("*"),
    ]);

  const currentProfile = (profiles as Profile[] | null)?.find((p) => p.id === user?.id);
  if (!currentProfile) return null;

  const completed = tasks.filter((t) => t.status === "completed").length;
  const pct = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("overflow-hidden rounded-2xl text-white shadow-soft-lg", EVENT_GRADIENTS[(event as WeddingEvent).color_theme])}>
        <div className="p-6 sm:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">
            {(event as WeddingEvent).event_date ? formatDate((event as WeddingEvent).event_date!, "EEEE, d MMMM yyyy") : "Date TBD"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{(event as WeddingEvent).name}</h1>
          {(event as WeddingEvent).description && (
            <p className="mt-2 max-w-xl text-sm text-white/80">{(event as WeddingEvent).description}</p>
          )}
          <div className="mt-5 max-w-sm">
            <Progress value={pct} />
            <p className="mt-1.5 text-xs text-white/80">{completed}/{tasks.length} tasks complete · {pct}%</p>
          </div>
        </div>
      </div>

      <EventDetailTabs
        event={event as WeddingEvent}
        tasks={tasks}
        shopping={(shopping as ShoppingItem[]) ?? []}
        budget={(budget as BudgetItem[]) ?? []}
        vendors={(vendors as Vendor[]) ?? []}
        events={(allEvents as WeddingEvent[]) ?? []}
        members={(profiles as Profile[]) ?? []}
        currentProfile={currentProfile}
      />
    </div>
  );
}
