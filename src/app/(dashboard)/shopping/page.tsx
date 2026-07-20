import { createClient } from "@/lib/supabase/server";
import { ShoppingTable } from "@/components/shopping/shopping-table";
import type { WeddingEvent, Profile, ShoppingItem } from "@/lib/types";

export default async function ShoppingPage() {
  const supabase = createClient();
  const [{ data: items }, { data: events }, { data: profiles }] = await Promise.all([
    supabase.from("shopping_items").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").eq("status", "active").order("position"),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Shopping Planner</h1>
        <p className="text-sm text-muted-foreground">Everything to buy, organized by category.</p>
      </div>
      <ShoppingTable
        items={(items as ShoppingItem[]) ?? []}
        events={(events as WeddingEvent[]) ?? []}
        members={(profiles as Profile[]) ?? []}
      />
    </div>
  );
}
