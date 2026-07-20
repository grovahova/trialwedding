import { createClient } from "@/lib/supabase/server";
import { BudgetTable } from "@/components/budget/budget-table";
import type { BudgetItem, WeddingEvent, Vendor } from "@/lib/types";

export default async function BudgetPage() {
  const supabase = createClient();
  const [{ data: items }, { data: events }, { data: vendors }] = await Promise.all([
    supabase.from("budget_items").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").eq("status", "active").order("position"),
    supabase.from("vendors").select("*"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Budget</h1>
        <p className="text-sm text-muted-foreground">Planned vs. actual spend across every event.</p>
      </div>
      <BudgetTable
        items={(items as BudgetItem[]) ?? []}
        events={(events as WeddingEvent[]) ?? []}
        vendors={(vendors as Vendor[]) ?? []}
      />
    </div>
  );
}
