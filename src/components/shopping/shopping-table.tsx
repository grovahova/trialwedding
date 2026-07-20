"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AddShoppingItemDialog } from "@/components/shopping/add-shopping-item-dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { ShoppingItem, WeddingEvent, Profile } from "@/lib/types";

export function ShoppingTable({
  items,
  events,
  members,
  defaultEventId,
}: {
  items: ShoppingItem[];
  events: WeddingEvent[];
  members: Profile[];
  defaultEventId?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const totalBudget = items.reduce((sum, i) => sum + Number(i.budget_amount), 0);
  const totalActual = items.reduce((sum, i) => sum + Number(i.actual_amount ?? 0), 0);
  const purchased = items.filter((i) => i.status === "purchased").length;

  const grouped = useMemo(() => {
    const map: Record<string, ShoppingItem[]> = {};
    for (const item of items) {
      map[item.category] ??= [];
      map[item.category].push(item);
    }
    return map;
  }, [items]);

  async function togglePurchased(item: ShoppingItem) {
    const nextStatus = item.status === "purchased" ? "pending" : "purchased";
    const { error } = await supabase.from("shopping_items").update({ status: nextStatus }).eq("id", item.id);
    if (error) return toast.error("Could not update item");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Items Purchased</p>
          <p className="mt-1 font-display text-2xl font-semibold">{purchased}/{items.length}</p>
          <Progress className="mt-2" value={items.length ? (purchased / items.length) * 100 : 0} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Total Budgeted</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
          <p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(totalActual)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="gold" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="rounded-xl border border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{category}</h3>
            <span className="text-xs text-muted-foreground">({catItems.length})</span>
          </div>
          <div className="divide-y divide-border">
            {catItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity} {item.store && `· ${item.store}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{formatCurrency(Number(item.actual_amount ?? item.budget_amount))}</p>
                  {item.actual_amount != null && (
                    <p className="text-xs text-muted-foreground">Budget {formatCurrency(Number(item.budget_amount))}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={item.status === "purchased" ? "default" : "outline"}
                  onClick={() => togglePurchased(item)}
                >
                  {item.status === "purchased" ? <Check className="h-3.5 w-3.5" /> : null}
                  {item.status === "purchased" ? "Purchased" : "Mark purchased"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No shopping items yet. Add your first one above.
        </div>
      )}

      <AddShoppingItemDialog open={open} onOpenChange={setOpen} events={events} members={members} defaultEventId={defaultEventId} />
    </div>
  );
}
