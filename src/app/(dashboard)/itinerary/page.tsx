import { createClient } from "@/lib/supabase/server";
import { ItineraryTimeline } from "@/components/itinerary/itinerary-timeline";
import type { ItineraryItem, WeddingEvent, Profile } from "@/lib/types";

export default async function ItineraryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: items }, { data: events }, { data: profile }] = await Promise.all([
    supabase
      .from("itinerary_items")
      .select("*, event:events(id, name, color_theme)")
      .order("item_date")
      .order("position"),
    supabase.from("events").select("*").eq("status", "active").order("position"),
    supabase.from("profiles").select("*").eq("id", user?.id).single(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Day-of Itinerary</h1>
        <p className="text-sm text-muted-foreground">The run of show — every ceremony, hour by hour.</p>
      </div>
      <ItineraryTimeline
        items={(items as ItineraryItem[]) ?? []}
        events={(events as WeddingEvent[]) ?? []}
        isAdmin={(profile as Profile | null)?.role === "admin"}
      />
    </div>
  );
}
